/**
 * Fix user by adding firebaseUid to existing user
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function fixUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sustainable-construction');
    console.log('✓ Connected to MongoDB\n');

    const email = 'asath12882@gmail.com';
    const firebaseUid = 'mlWKUWjXzJd5uqaHZkA6gwdb1sI2';

    console.log(`🔧 Fixing user: ${email}`);
    console.log(`   Adding firebaseUid: ${firebaseUid}\n`);

    const result = await User.updateOne(
      { email },
      { $set: { firebaseUid } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ User updated successfully!');
      
      // Verify the fix
      const user = await User.findOne({ email });
      console.log('\n✓ Verification:');
      console.log('  Name:', user.name);
      console.log('  Email:', user.email);
      console.log('  Firebase UID:', user.firebaseUid);
      console.log('  Role:', user.role);
      console.log('\n🎉 User can now login successfully!');
    } else {
      console.log('⚠️  No changes made (user might already have firebaseUid)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected');
  }
}

fixUser();

