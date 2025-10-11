require('dotenv').config();
const storageService = require('./src/services/storage.service');

console.log('🔗 Testing URL Generation\n');

// Test with a sample file key
const testKey = 'project123/1234567890-test-image.jpg';

console.log('Test File Key:', testKey);
console.log();

console.log('Configuration:');
console.log(`  Bucket: ${process.env.SPACES_BUCKET}`);
console.log(`  CDN Enabled: ${process.env.SPACES_CDN_ENABLED}`);
console.log(`  CDN Endpoint: ${process.env.SPACES_CDN_ENDPOINT || 'Not set'}`);
console.log();

const fileUrl = storageService.getFileUrl(testKey);
console.log('Generated URL:');
console.log(`  ${fileUrl}`);
console.log();

if (fileUrl.includes('cdn.digitaloceanspaces.com')) {
  console.log('⚠️  WARNING: Using CDN URL - this may have SSL issues with dots in bucket name');
} else if (fileUrl.includes('.sfo3.digitaloceanspaces.com/')) {
  console.log('⚠️  WARNING: Using virtual-hosted-style URL - this may have SSL issues with dots in bucket name');
  console.log('   Expected format: https://sfo3.digitaloceanspaces.com/space.uee/...');
} else if (fileUrl.includes('digitaloceanspaces.com/space.uee/')) {
  console.log('✅ Using path-style URL - this should work correctly!');
} else {
  console.log('❓ Unknown URL format');
}

