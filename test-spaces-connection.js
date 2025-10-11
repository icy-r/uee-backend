require('dotenv').config();
const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  endpoint: `https://${process.env.SPACES_ENDPOINT || 'sfo3.digitaloceanspaces.com'}`,
  region: process.env.SPACES_REGION || 'sfo3',
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET
  },
  forcePathStyle: false
});

async function testConnection() {
  console.log('🔍 Testing DigitalOcean Spaces Connection...\n');
  
  // Test 1: Check credentials
  console.log('📋 Configuration:');
  console.log(`  Bucket: ${process.env.SPACES_BUCKET || 'space.uee'}`);
  console.log(`  Region: ${process.env.SPACES_REGION || 'sfo3'}`);
  console.log(`  Endpoint: ${process.env.SPACES_ENDPOINT || 'sfo3.digitaloceanspaces.com'}`);
  console.log(`  CDN: ${process.env.SPACES_CDN_ENDPOINT || 'Not configured'}`);
  console.log(`  Access Key: ${process.env.SPACES_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Secret Key: ${process.env.SPACES_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log();

  if (!process.env.SPACES_KEY || !process.env.SPACES_SECRET) {
    console.error('❌ ERROR: Spaces credentials not configured!');
    console.log('\nAdd to your .env file:');
    console.log('SPACES_KEY=your_access_key');
    console.log('SPACES_SECRET=your_secret_key');
    return;
  }

  try {
    // Test 2: List objects in bucket
    console.log('📁 Testing bucket access...');
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.SPACES_BUCKET || 'space.uee',
      MaxKeys: 5
    });
    
    const listResult = await s3Client.send(listCommand);
    console.log(`✅ Successfully connected to bucket!`);
    console.log(`   Found ${listResult.KeyCount} objects (showing max 5)`);
    
    if (listResult.Contents && listResult.Contents.length > 0) {
      console.log('\n📄 Sample files in bucket:');
      listResult.Contents.forEach(item => {
        console.log(`   - ${item.Key} (${(item.Size / 1024).toFixed(2)} KB)`);
      });
    } else {
      console.log('   Bucket is empty');
    }
    console.log();

    // Test 3: Try to upload a test file
    console.log('📤 Testing file upload...');
    const testContent = 'This is a test file from UEE Backend';
    const testKey = 'test/connection-test.txt';
    
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.SPACES_BUCKET || 'space.uee',
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
      ACL: 'public-read'
    });
    
    await s3Client.send(uploadCommand);
    console.log('✅ Test file uploaded successfully!');
    
    // Generate URLs
    const bucketName = process.env.SPACES_BUCKET || 'space.uee';
    const region = process.env.SPACES_REGION || 'sfo3';
    const cdnEndpoint = process.env.SPACES_CDN_ENDPOINT;
    
    const originUrl = `https://${bucketName}.${region}.digitaloceanspaces.com/${testKey}`;
    const cdnUrl = cdnEndpoint ? `${cdnEndpoint}/${testKey}` : 'CDN not configured';
    
    console.log('\n🔗 Test file URLs:');
    console.log(`   Origin: ${originUrl}`);
    console.log(`   CDN:    ${cdnUrl}`);
    console.log('\n💡 Try opening these URLs in your browser to test access');
    console.log();

    // Test 4: Try to read the file back
    console.log('📥 Testing file download...');
    const getCommand = new GetObjectCommand({
      Bucket: process.env.SPACES_BUCKET || 'space.uee',
      Key: testKey
    });
    
    await s3Client.send(getCommand);
    console.log('✅ Test file can be read successfully!');
    console.log();

    console.log('✅ All tests passed! Your Spaces configuration is working correctly.');
    console.log();
    console.log('⚠️  If the URLs don\'t work in browser, check:');
    console.log('   1. Bucket CORS settings in DigitalOcean dashboard');
    console.log('   2. Bucket permissions (should allow public read)');
    console.log('   3. CDN is enabled and configured');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log();
    
    if (error.Code === 'NoSuchBucket') {
      console.log('💡 The bucket does not exist or the name is incorrect.');
      console.log('   Check that SPACES_BUCKET=space.uee in your .env');
    } else if (error.Code === 'InvalidAccessKeyId') {
      console.log('💡 Invalid access key. Check your SPACES_KEY in .env');
    } else if (error.Code === 'SignatureDoesNotMatch') {
      console.log('💡 Invalid secret key. Check your SPACES_SECRET in .env');
    } else if (error.Code === 'AccessDenied') {
      console.log('💡 Access denied. Your API keys might not have the correct permissions.');
      console.log('   Go to: DigitalOcean → API → Spaces Keys');
      console.log('   Ensure the key has read/write permissions for this bucket.');
    }
  }
}

testConnection().catch(console.error);

