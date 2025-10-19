/**
 * Test Migration Script
 * 
 * Creates sample Firebase users for testing the migration script
 * 
 * Usage:
 *   node migrations/test-migration.js create    # Create test users in Firebase
 *   node migrations/test-migration.js migrate   # Run migration
 *   node migrations/test-migration.js verify    # Verify migration results
 *   node migrations/test-migration.js cleanup   # Remove test users
 */

const admin = require('firebase-admin');
const mongoose = require('mongoose');
const { main: runMigration } = require('./sync-firebase-users');
require('dotenv').config();

const User = require('../src/models/User');

// Test users data
const testUsers = [
  {
    email: 'manager.test@construction.com',
    password: 'Test123!',
    displayName: 'Test Manager',
    phoneNumber: '+1234567890',
    customClaims: { role: 'Admin' }
  },
  {
    email: 'worker1.test@construction.com',
    password: 'Test123!',
    displayName: 'Test Worker 1',
    phoneNumber: '+1234567891',
    customClaims: { role: 'Worker' }
  },
  {
    email: 'worker2.test@construction.com',
    password: 'Test123!',
    displayName: 'Test Worker 2',
    phoneNumber: '+1234567892',
    customClaims: { role: 'Worker' }
  }
];

/**
 * Initialize Firebase Admin
 */
function initializeFirebase() {
  try {
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
      throw new Error('Firebase credentials not found');
    }
    console.log('✓ Firebase initialized');
  } catch (error) {
    console.error('✗ Failed to initialize Firebase:', error.message);
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
 * Create test users in Firebase
 */
async function createTestUsers() {
  console.log('\n📝 Creating test users in Firebase...\n');
  
  const createdUsers = [];
  
  for (const userData of testUsers) {
    try {
      // Check if user already exists
      let user;
      try {
        user = await admin.auth().getUserByEmail(userData.email);
        console.log(`⚠️  User ${userData.email} already exists (UID: ${user.uid})`);
        createdUsers.push(user);
        continue;
      } catch (error) {
        if (error.code !== 'auth/user-not-found') {
          throw error;
        }
      }
      
      // Create user
      user = await admin.auth().createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        emailVerified: false
      });
      
      // Set custom claims
      if (userData.customClaims) {
        await admin.auth().setCustomUserClaims(user.uid, userData.customClaims);
      }
      
      console.log(`✓ Created: ${userData.email} (UID: ${user.uid}, Role: ${userData.customClaims?.role})`);
      createdUsers.push(user);
      
    } catch (error) {
      console.error(`✗ Failed to create ${userData.email}:`, error.message);
    }
  }
  
  console.log(`\n✓ Created ${createdUsers.length} test users in Firebase`);
  return createdUsers;
}

/**
 * Verify migration results
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying migration results...\n');
  
  const firebaseUserCount = (await admin.auth().listUsers()).users.length;
  const mongoUserCount = await User.countDocuments();
  
  console.log(`Firebase users: ${firebaseUserCount}`);
  console.log(`MongoDB users: ${mongoUserCount}`);
  
  // Check each test user
  console.log('\nTest Users Verification:\n');
  
  for (const testUser of testUsers) {
    try {
      const firebaseUser = await admin.auth().getUserByEmail(testUser.email);
      const mongoUser = await User.findOne({ firebaseUid: firebaseUser.uid });
      
      if (mongoUser) {
        console.log(`✓ ${testUser.email}`);
        console.log(`  Firebase UID: ${firebaseUser.uid}`);
        console.log(`  MongoDB ID: ${mongoUser._id}`);
        console.log(`  Name: ${mongoUser.name}`);
        console.log(`  Role: ${mongoUser.role}`);
        console.log(`  Status: ${mongoUser.status}`);
      } else {
        console.log(`✗ ${testUser.email} - Not found in MongoDB`);
      }
      console.log();
      
    } catch (error) {
      console.log(`✗ ${testUser.email} - ${error.message}\n`);
    }
  }
}

/**
 * Clean up test users
 */
async function cleanupTestUsers() {
  console.log('\n🧹 Cleaning up test users...\n');
  
  let deletedFirebase = 0;
  let deletedMongo = 0;
  
  for (const testUser of testUsers) {
    try {
      // Delete from Firebase
      const firebaseUser = await admin.auth().getUserByEmail(testUser.email);
      await admin.auth().deleteUser(firebaseUser.uid);
      deletedFirebase++;
      console.log(`✓ Deleted from Firebase: ${testUser.email}`);
      
      // Delete from MongoDB
      const result = await User.deleteOne({ firebaseUid: firebaseUser.uid });
      if (result.deletedCount > 0) {
        deletedMongo++;
        console.log(`✓ Deleted from MongoDB: ${testUser.email}`);
      }
      
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`⚠️  ${testUser.email} not found in Firebase`);
      } else {
        console.error(`✗ Failed to delete ${testUser.email}:`, error.message);
      }
    }
  }
  
  console.log(`\n✓ Cleanup complete (Firebase: ${deletedFirebase}, MongoDB: ${deletedMongo})`);
}

/**
 * Main test function
 */
async function main() {
  const command = process.argv[2];
  
  console.log('🧪 Migration Test Script');
  console.log('========================\n');
  
  if (!command) {
    console.log('Usage:');
    console.log('  node migrations/test-migration.js create    # Create test users');
    console.log('  node migrations/test-migration.js migrate   # Run migration');
    console.log('  node migrations/test-migration.js verify    # Verify results');
    console.log('  node migrations/test-migration.js cleanup   # Remove test users');
    console.log('  node migrations/test-migration.js all       # Run all steps');
    process.exit(0);
  }
  
  try {
    initializeFirebase();
    await connectMongoDB();
    
    switch (command) {
      case 'create':
        await createTestUsers();
        break;
        
      case 'migrate':
        console.log('\n🔄 Running migration...\n');
        await runMigration();
        break;
        
      case 'verify':
        await verifyMigration();
        break;
        
      case 'cleanup':
        await cleanupTestUsers();
        break;
        
      case 'all':
        await createTestUsers();
        console.log('\n' + '='.repeat(60) + '\n');
        
        console.log('Running migration in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await runMigration();
        console.log('\n' + '='.repeat(60) + '\n');
        
        await verifyMigration();
        console.log('\n' + '='.repeat(60) + '\n');
        
        console.log('Clean up? (y/N)');
        // For automated testing, skip cleanup prompt
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Done');
  }
}

// Run test
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createTestUsers, verifyMigration, cleanupTestUsers };

