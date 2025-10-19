/**
 * Firebase Cloud Functions
 * Automatically sync users to MongoDB when created/updated in Firebase Auth
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin
admin.initializeApp();

// Your backend API URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

/**
 * Trigger when a new user is created in Firebase Authentication
 * Automatically syncs the user to MongoDB via webhook
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  console.log('New user created:', user.email, user.uid);

  try {
    // Call backend webhook to sync user
    const response = await axios.post(`${BACKEND_URL}/api/sync/webhook`, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      event: 'user.created'
    }, {
      timeout: 10000 // 10 second timeout
    });

    console.log('User synced to MongoDB:', response.data);
    return { success: true, message: 'User synced to MongoDB' };

  } catch (error) {
    console.error('Failed to sync user to MongoDB:', error.message);
    // Don't throw error - user creation should succeed even if sync fails
    // Sync will happen automatically on first login via auth middleware
    return { success: false, message: error.message };
  }
});

/**
 * Trigger when a user is deleted from Firebase Authentication
 * Optionally soft-delete or archive the user in MongoDB
 */
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
  console.log('User deleted:', user.email, user.uid);

  try {
    // Call backend to handle user deletion
    const response = await axios.post(`${BACKEND_URL}/api/sync/webhook`, {
      uid: user.uid,
      email: user.email,
      event: 'user.deleted'
    }, {
      timeout: 10000
    });

    console.log('User deletion handled:', response.data);
    return { success: true };

  } catch (error) {
    console.error('Failed to handle user deletion:', error.message);
    return { success: false, message: error.message };
  }
});

/**
 * Manual sync trigger via HTTP
 * Can be called directly to force sync a user
 * 
 * Usage:
 * POST https://REGION-PROJECT_ID.cloudfunctions.net/syncUserToMongo
 * Body: { "uid": "firebase-user-id" }
 */
exports.syncUserToMongo = functions.https.onRequest(async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'Firebase UID is required' });
  }

  try {
    // Get user from Firebase
    const user = await admin.auth().getUser(uid);

    // Call backend webhook
    const response = await axios.post(`${BACKEND_URL}/api/sync/webhook`, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      event: 'user.manual_sync'
    }, {
      timeout: 10000
    });

    return res.status(200).json({
      success: true,
      message: 'User synced successfully',
      data: response.data
    });

  } catch (error) {
    console.error('Manual sync error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

