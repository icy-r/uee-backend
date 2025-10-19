/**
 * Firebase Users to MongoDB Migration Script
 * 
 * This script syncs users from Firebase Authentication to MongoDB.
 * It handles both initial migration and incremental updates.
 * 
 * Usage:
 *   node migrations/sync-firebase-users.js
 * 
 * Options:
 *   --dry-run    : Show what would be synced without making changes
 *   --force      : Overwrite existing users in MongoDB
 *   --batch-size : Number of users to process at once (default: 100)
 */

const admin = require('firebase-admin');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../src/models/User');

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const forceUpdate = args.includes('--force');
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 100;

// Statistics
const stats = {
  total: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
  errorDetails: []
};

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  try {
    // Initialize with service account or default credentials
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    } else {
      throw new Error('Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS');
    }
    
    console.log('✓ Firebase Admin initialized');
  } catch (error) {
    console.error('✗ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

/**
 * Connect to MongoDB
 */
async function connectMongoDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sustainable-construction';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

/**
 * Fetch all users from Firebase Auth
 */
async function fetchFirebaseUsers() {
  console.log('\nFetching users from Firebase Auth...');
  const users = [];
  let nextPageToken;

  try {
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      users.push(...listUsersResult.users);
      nextPageToken = listUsersResult.pageToken;
      
      process.stdout.write(`\rFetched ${users.length} users...`);
    } while (nextPageToken);

    console.log(`\n✓ Fetched ${users.length} users from Firebase`);
    return users;
  } catch (error) {
    console.error('\n✗ Error fetching Firebase users:', error.message);
    throw error;
  }
}

/**
 * Map Firebase user to MongoDB user schema
 */
function mapFirebaseUserToMongo(firebaseUser) {
  // Determine role from custom claims or default to Worker
  const customClaims = firebaseUser.customClaims || {};
  const role = customClaims.role || 'Worker';

  return {
    firebaseUid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || 'Unnamed User',
    phone: firebaseUser.phoneNumber || '',
    avatar: firebaseUser.photoURL || '',
    role: role,
    status: firebaseUser.disabled ? 'inactive' : 'active',
    emailVerified: firebaseUser.emailVerified || false,
    // Set default password (users will need to reset if they want to use MongoDB auth)
    password: '$2b$10$defaultHashedPassword', // This should be changed by user
    lastLogin: firebaseUser.metadata.lastSignInTime 
      ? new Date(firebaseUser.metadata.lastSignInTime) 
      : null,
    // Additional metadata
    metadata: {
      creationTime: firebaseUser.metadata.creationTime,
      lastSignInTime: firebaseUser.metadata.lastSignInTime,
      lastRefreshTime: firebaseUser.metadata.lastRefreshTime,
    },
    // Provider data
    providers: firebaseUser.providerData.map(p => ({
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
 * Sync a single user to MongoDB
 */
async function syncUser(firebaseUser, index, total) {
  const userEmail = firebaseUser.email || firebaseUser.uid;
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ firebaseUid: firebaseUser.uid });
    
    if (existingUser && !forceUpdate) {
      stats.skipped++;
      if (!isDryRun) {
        process.stdout.write(`\r[${index + 1}/${total}] Skipped: ${userEmail} (already exists)`);
      }
      return;
    }

    const userData = mapFirebaseUserToMongo(firebaseUser);

    if (isDryRun) {
      console.log(`\n[DRY RUN] Would ${existingUser ? 'update' : 'create'}: ${userEmail}`);
      console.log('Data:', JSON.stringify(userData, null, 2));
      if (existingUser) stats.updated++;
      else stats.created++;
      return;
    }

    if (existingUser) {
      // Update existing user
      Object.assign(existingUser, userData);
      existingUser.updatedAt = new Date();
      await existingUser.save();
      stats.updated++;
      process.stdout.write(`\r[${index + 1}/${total}] Updated: ${userEmail}`);
    } else {
      // Create new user
      const newUser = new User(userData);
      newUser.setDefaultPermissions();
      await newUser.save();
      stats.created++;
      process.stdout.write(`\r[${index + 1}/${total}] Created: ${userEmail}`);
    }
  } catch (error) {
    stats.errors++;
    stats.errorDetails.push({
      user: userEmail,
      error: error.message
    });
    process.stdout.write(`\r[${index + 1}/${total}] Error: ${userEmail} - ${error.message}`);
  }
}

/**
 * Sync users in batches
 */
async function syncUsersInBatches(firebaseUsers) {
  console.log(`\nSyncing ${firebaseUsers.length} users to MongoDB...`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Force update: ${forceUpdate ? 'YES' : 'NO'}\n`);

  stats.total = firebaseUsers.length;

  for (let i = 0; i < firebaseUsers.length; i += batchSize) {
    const batch = firebaseUsers.slice(i, i + batchSize);
    
    // Process batch in parallel
    await Promise.all(
      batch.map((user, batchIndex) => 
        syncUser(user, i + batchIndex, firebaseUsers.length)
      )
    );
  }

  console.log('\n'); // New line after progress
}

/**
 * Print migration summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total users processed: ${stats.total}`);
  console.log(`Created: ${stats.created}`);
  console.log(`Updated: ${stats.updated}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  
  if (stats.errorDetails.length > 0) {
    console.log('\nERROR DETAILS:');
    stats.errorDetails.forEach(({ user, error }) => {
      console.log(`  - ${user}: ${error}`);
    });
  }
  
  console.log('='.repeat(60));
  
  if (isDryRun) {
    console.log('\n⚠️  This was a DRY RUN. No changes were made to MongoDB.');
    console.log('Remove --dry-run flag to perform actual migration.');
  } else {
    console.log('\n✓ Migration completed successfully!');
  }
}

/**
 * Verify migration results
 */
async function verifyMigration() {
  if (isDryRun) return;

  console.log('\nVerifying migration...');
  
  try {
    const mongoUserCount = await User.countDocuments();
    console.log(`✓ MongoDB users: ${mongoUserCount}`);
    
    // Check for users without firebaseUid
    const usersWithoutFirebaseUid = await User.countDocuments({ 
      $or: [
        { firebaseUid: { $exists: false } },
        { firebaseUid: null },
        { firebaseUid: '' }
      ]
    });
    
    if (usersWithoutFirebaseUid > 0) {
      console.log(`⚠️  Warning: ${usersWithoutFirebaseUid} users without Firebase UID`);
    }
    
    // Sample user verification
    const sampleUser = await User.findOne({ firebaseUid: { $exists: true } });
    if (sampleUser) {
      console.log('✓ Sample user verified:', {
        name: sampleUser.name,
        email: sampleUser.email,
        role: sampleUser.role,
        firebaseUid: sampleUser.firebaseUid
      });
    }
  } catch (error) {
    console.error('✗ Verification error:', error.message);
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🔄 Firebase to MongoDB User Migration');
  console.log('=====================================\n');

  try {
    // Initialize
    initializeFirebase();
    await connectMongoDB();

    // Fetch Firebase users
    const firebaseUsers = await fetchFirebaseUsers();

    if (firebaseUsers.length === 0) {
      console.log('⚠️  No users found in Firebase Auth');
      return;
    }

    // Sync users
    await syncUsersInBatches(firebaseUsers);

    // Verify
    await verifyMigration();

    // Print summary
    printSummary();

  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Cleanup
    await mongoose.connection.close();
    console.log('\n✓ MongoDB connection closed');
  }
}

// Run migration
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { main, syncUser, mapFirebaseUserToMongo };

