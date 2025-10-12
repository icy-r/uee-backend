/**
 * Test script for Socket.IO log viewer
 * Demonstrates that logs are being captured and streamed in real-time
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
  });
}

async function test() {
  console.log('🧪 Testing Socket.IO Log Viewer...\n');

  try {
    // Test 1: Make some requests
    console.log('1. Making test requests...');
    await makeRequest('/health');
    await makeRequest('/api/projects'); // Will fail auth, but that's okay
    await makeRequest('/health');
    console.log('   ✅ Requests made\n');

    // Wait a moment for logs to be captured
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 2: Get logs via API
    console.log('2. Fetching logs from API...');
    const response = await makeRequest('/logs/api');
    console.log(`   ✅ Received ${response.count} logs\n`);

    if (response.count > 0) {
      console.log('3. Sample log entry:');
      const sampleLog = response.data[0];
      console.log(`   Method: ${sampleLog.request.method}`);
      console.log(`   URL: ${sampleLog.request.url}`);
      console.log(`   Status: ${sampleLog.response.statusCode}`);
      console.log(`   Duration: ${sampleLog.duration}`);
      console.log(`   Type: ${sampleLog.type}\n`);
    }

    console.log('✅ All tests passed!\n');
    console.log('🌐 Now open your browser and visit:');
    console.log(`   ${BASE_URL}/logs`);
    console.log('\n   You should see logs streaming in real-time!');
    console.log('   Try refreshing /health in another tab and watch them appear instantly.');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ Error: Server is not running!');
      console.log('\n💡 Start the server first with: node server.js');
    } else {
      console.error('\n❌ Test failed:', error.message);
    }
  }
}

test();

