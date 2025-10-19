/**
 * Auto-Sync Firebase User Middleware
 * 
 * Automatically syncs Firebase users to MongoDB on first authentication
 * This ensures every authenticated user exists in MongoDB
 */

const User = require('../models/User');
const admin = require('firebase-admin');

/**
 * Map Firebase user to MongoDB user schema
 */
function mapFirebaseUserToMongo(firebaseUser, customClaims = {}) {
  const role = customClaims.role || 'Worker';

  return {
    firebaseUid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Unnamed User',
    phone: firebaseUser.phoneNumber || '',
    avatar: firebaseUser.photoURL || '',
    role: role,
    status: firebaseUser.disabled ? 'inactive' : 'active',
    emailVerified: firebaseUser.emailVerified || false,
    // Set default password (users will need to reset if they want to use MongoDB auth)
    password: '$2b$10$defaultHashedPassword',
    lastLogin: new Date(),
    metadata: {
      creationTime: firebaseUser.metadata?.creationTime,
      lastSignInTime: firebaseUser.metadata?.lastSignInTime,
    },
    // Provider data
    providers: (firebaseUser.providerData || []).map(p => ({
      providerId: p.providerId,
      uid: p.uid,
      displayName: p.displayName,
      email: p.email,
      photoURL: p.photoURL,
      phoneNumber: p.phoneNumber
    }))
  };
}

/**
 * Sync Firebase user to MongoDB
 */
async function syncFirebaseUserToMongo(firebaseUid) {
  try {
    // Check if user already exists in MongoDB
    let mongoUser = await User.findOne({ firebaseUid });
    
    if (mongoUser) {
      // Update last login
      mongoUser.lastLogin = new Date();
      await mongoUser.save();
      return { synced: false, user: mongoUser, message: 'User already exists' };
    }

    // Fetch user details from Firebase
    const firebaseUser = await admin.auth().getUser(firebaseUid);
    
    // Get custom claims
    const customClaims = firebaseUser.customClaims || {};
    
    // Map to MongoDB schema
    const userData = mapFirebaseUserToMongo(firebaseUser, customClaims);
    
    // Create new user in MongoDB
    mongoUser = new User(userData);
    mongoUser.setDefaultPermissions();
    await mongoUser.save();
    
    console.log(`✓ Auto-synced new user: ${firebaseUser.email} (${firebaseUid})`);
    
    return { synced: true, user: mongoUser, message: 'User created successfully' };
    
  } catch (error) {
    console.error(`✗ Failed to sync user ${firebaseUid}:`, error.message);
    throw error;
  }
}

/**
 * Middleware to auto-sync authenticated Firebase users
 */
const autoSyncFirebaseUser = async (req, res, next) => {
  try {
    // Skip if no authenticated user
    if (!req.user || !req.user.uid) {
      return next();
    }

    const firebaseUid = req.user.uid;

    // Check if user exists in MongoDB
    let mongoUser = await User.findOne({ firebaseUid });

    if (!mongoUser) {
      // User doesn't exist, auto-sync from Firebase
      console.log(`🔄 Auto-syncing new user: ${firebaseUid}`);
      
      const result = await syncFirebaseUserToMongo(firebaseUid);
      mongoUser = result.user;
      
      // Attach to request for use in controllers
      req.mongoUser = mongoUser;
      req.userSyncedNow = true;
    } else {
      // User exists, just attach to request
      req.mongoUser = mongoUser;
      req.userSyncedNow = false;
      
      // Update last login (async, don't wait)
      User.findByIdAndUpdate(mongoUser._id, { 
        lastLogin: new Date() 
      }).catch(err => console.error('Failed to update last login:', err));
    }

    next();
  } catch (error) {
    console.error('Auto-sync middleware error:', error);
    // Don't block request if sync fails
    next();
  }
};

module.exports = {
  autoSyncFirebaseUser,
  syncFirebaseUserToMongo,
  mapFirebaseUserToMongo
};

