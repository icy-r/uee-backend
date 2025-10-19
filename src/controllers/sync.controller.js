/**
 * Sync Controller
 * Handles manual and webhook-triggered user synchronization
 */

const { syncFirebaseUserToMongo } = require('../middleware/autoSyncFirebaseUser');
const User = require('../models/User');
const admin = require('firebase-admin');
const catchAsync = require('../utils/catchAsync');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Manually sync a specific Firebase user to MongoDB
 * POST /api/sync/user/:firebaseUid
 */
exports.syncUser = catchAsync(async (req, res) => {
  const { firebaseUid } = req.params;

  if (!firebaseUid) {
    return errorResponse(res, 'Firebase UID is required', 400);
  }

  try {
    const result = await syncFirebaseUserToMongo(firebaseUid);
    
    successResponse(
      res,
      {
        user: result.user,
        synced: result.synced,
        message: result.message
      },
      result.synced ? 'User synced successfully' : 'User already exists',
      result.synced ? 201 : 200
    );
  } catch (error) {
    errorResponse(res, `Failed to sync user: ${error.message}`, 500);
  }
});

/**
 * Sync current authenticated user to MongoDB
 * POST /api/sync/me
 */
exports.syncCurrentUser = catchAsync(async (req, res) => {
  if (!req.user || !req.user.uid) {
    return errorResponse(res, 'Authentication required', 401);
  }

  try {
    const result = await syncFirebaseUserToMongo(req.user.uid);
    
    successResponse(
      res,
      {
        user: result.user,
        synced: result.synced,
        message: result.message
      },
      result.synced ? 'User synced successfully' : 'User already exists',
      result.synced ? 201 : 200
    );
  } catch (error) {
    errorResponse(res, `Failed to sync user: ${error.message}`, 500);
  }
});

/**
 * Sync all Firebase users to MongoDB
 * POST /api/sync/all
 */
exports.syncAllUsers = catchAsync(async (req, res) => {
  const { force = false, batchSize = 100 } = req.body;

  try {
    // Fetch all Firebase users
    const listUsersResult = await admin.auth().listUsers(1000);
    const firebaseUsers = listUsersResult.users;

    const stats = {
      total: firebaseUsers.length,
      synced: 0,
      skipped: 0,
      errors: 0
    };

    // Process in batches
    for (let i = 0; i < firebaseUsers.length; i += batchSize) {
      const batch = firebaseUsers.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (user) => {
          try {
            // Check if user exists
            const existingUser = await User.findOne({ firebaseUid: user.uid });
            
            if (existingUser && !force) {
              stats.skipped++;
              return;
            }

            const result = await syncFirebaseUserToMongo(user.uid);
            if (result.synced) {
              stats.synced++;
            } else {
              stats.skipped++;
            }
          } catch (error) {
            console.error(`Error syncing ${user.email}:`, error.message);
            stats.errors++;
          }
        })
      );
    }

    successResponse(
      res,
      stats,
      `Sync completed: ${stats.synced} synced, ${stats.skipped} skipped, ${stats.errors} errors`
    );
  } catch (error) {
    errorResponse(res, `Failed to sync all users: ${error.message}`, 500);
  }
});

/**
 * Webhook endpoint for Firebase Cloud Functions
 * POST /api/sync/webhook
 * 
 * Expected payload:
 * {
 *   "uid": "firebase-user-id",
 *   "email": "user@example.com",
 *   "event": "user.created" | "user.updated"
 * }
 */
exports.webhookSync = catchAsync(async (req, res) => {
  const { uid, email, event } = req.body;

  if (!uid) {
    return errorResponse(res, 'Firebase UID is required', 400);
  }

  console.log(`📥 Webhook received: ${event} for ${email} (${uid})`);

  try {
    const result = await syncFirebaseUserToMongo(uid);
    
    successResponse(
      res,
      {
        user: result.user,
        synced: result.synced,
        event: event
      },
      `Webhook processed: ${result.message}`,
      200
    );
  } catch (error) {
    console.error('Webhook sync error:', error);
    errorResponse(res, `Webhook sync failed: ${error.message}`, 500);
  }
});

/**
 * Get sync statistics
 * GET /api/sync/stats
 */
exports.getSyncStats = catchAsync(async (req, res) => {
  try {
    // Get Firebase user count
    const firebaseUsers = await admin.auth().listUsers(1000);
    const firebaseCount = firebaseUsers.users.length;

    // Get MongoDB user count
    const mongoCount = await User.countDocuments();
    
    // Count synced users (have firebaseUid)
    const syncedCount = await User.countDocuments({ 
      firebaseUid: { $exists: true, $ne: null, $ne: '' } 
    });

    // Count users without Firebase UID
    const unsyncedCount = await User.countDocuments({
      $or: [
        { firebaseUid: { $exists: false } },
        { firebaseUid: null },
        { firebaseUid: '' }
      ]
    });

    // Recent syncs (users created in last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSyncs = await User.countDocuments({
      firebaseUid: { $exists: true },
      createdAt: { $gte: yesterday }
    });

    successResponse(res, {
      firebase: {
        total: firebaseCount
      },
      mongodb: {
        total: mongoCount,
        synced: syncedCount,
        unsynced: unsyncedCount
      },
      sync: {
        percentage: ((syncedCount / firebaseCount) * 100).toFixed(2) + '%',
        missing: firebaseCount - syncedCount,
        recent24h: recentSyncs
      }
    }, 'Sync statistics retrieved successfully');
  } catch (error) {
    errorResponse(res, `Failed to get sync stats: ${error.message}`, 500);
  }
});
