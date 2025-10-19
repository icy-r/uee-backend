/**
 * Quick script to check user in database by email
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sustainable-construction');
    console.log('✓ Connected to MongoDB\n');

    const email = 'asath12882@gmail.com';
    const firebaseUid = 'mlWKUWjXzJd5uqaHZkA6gwdb1sI2';

    // Check by email
    console.log(`🔍 Searching for user by email: ${email}`);
    const userByEmail = await User.findOne({ email });
    
    if (userByEmail) {
      console.log('\n✅ USER FOUND BY EMAIL:');
      console.log('ID:', userByEmail._id);
      console.log('Name:', userByEmail.name);
      console.log('Email:', userByEmail.email);
      console.log('Firebase UID:', userByEmail.firebaseUid || '❌ MISSING!');
      console.log('Role:', userByEmail.role);
      console.log('Status:', userByEmail.status);
      console.log('Created:', userByEmail.createdAt);
    } else {
      console.log('❌ User NOT found by email');
    }

    // Check by firebaseUid
    console.log(`\n🔍 Searching for user by firebaseUid: ${firebaseUid}`);
    const userByFirebase = await User.findOne({ firebaseUid });
    
    if (userByFirebase) {
      console.log('\n✅ USER FOUND BY FIREBASE UID:');
      console.log('ID:', userByFirebase._id);
      console.log('Name:', userByFirebase.name);
      console.log('Email:', userByFirebase.email);
      console.log('Firebase UID:', userByFirebase.firebaseUid);
    } else {
      console.log('❌ User NOT found by firebaseUid');
    }

    // If found by email but not by firebaseUid, we need to update
    if (userByEmail && !userByFirebase) {
      console.log('\n⚠️  PROBLEM DETECTED:');
      console.log('User exists with email but missing/wrong firebaseUid');
      console.log('\n💡 FIX: Update the user with correct firebaseUid');
      console.log(`db.users.updateOne({email: "${email}"}, {$set: {firebaseUid: "${firebaseUid}"}})`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected');
  }
}

checkUser();

