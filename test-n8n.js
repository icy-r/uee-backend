/**
 * Quick test script for n8n integration
 * Run: node test-n8n.js
 */

const axios = require('axios');

const N8N_WEBHOOK_URL = 'https://n8n.icy-r.dev/webhook/31a220c7-a676-4434-9f5e-608d25d48ca7';

async function testHealthCheck() {
  console.log('🔍 Testing n8n health check...\n');
  
  try {
    const response = await axios.post(N8N_WEBHOOK_URL, {
      action: 'health-check'
    }, {
      timeout: 5000
    });
    
    console.log('✅ Health check successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

async function testExtractText() {
  console.log('\n🔍 Testing text extraction...\n');
  
  try {
    const response = await axios.post(N8N_WEBHOOK_URL, {
      action: 'extract-text',
      data: {
        image: 'sample_base64_or_url',
        filename: 'test.png',
        documentId: 'test-doc-123'
      }
    }, {
      timeout: 30000
    });
    
    console.log('✅ Text extraction test sent!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Text extraction failed:', error.message);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
    return false;
  }
}

async function testGenerateTasks() {
  console.log('\n🔍 Testing task generation...\n');
  
  try {
    const response = await axios.post(N8N_WEBHOOK_URL, {
      action: 'generate-tasks',
      data: {
        content: 'Sample construction plan content',
        documentType: 'plan',
        projectId: 'test-project-123',
        documentId: 'test-doc-123',
        maxTasks: 5
      }
    }, {
      timeout: 45000
    });
    
    console.log('✅ Task generation test sent!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Task generation failed:', error.message);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
    return false;
  }
}

async function runTests() {
  console.log('========================================');
  console.log('   n8n Integration Test Suite');
  console.log('========================================\n');
  console.log('Webhook URL:', N8N_WEBHOOK_URL);
  console.log('========================================\n');
  
  const results = {
    healthCheck: await testHealthCheck(),
    extractText: await testExtractText(),
    generateTasks: await testGenerateTasks()
  };
  
  console.log('\n========================================');
  console.log('   Test Results');
  console.log('========================================');
  console.log('Health Check:', results.healthCheck ? '✅ PASS' : '❌ FAIL');
  console.log('Extract Text:', results.extractText ? '✅ PASS' : '❌ FAIL');
  console.log('Generate Tasks:', results.generateTasks ? '✅ PASS' : '❌ FAIL');
  console.log('========================================\n');
  
  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    console.log('🎉 All tests passed! n8n integration is working!');
  } else {
    console.log('⚠️  Some tests failed. Check your n8n workflow configuration.');
    console.log('\nTips:');
    console.log('1. Make sure your n8n workflow is active');
    console.log('2. Check that the webhook URL is correct');
    console.log('3. Review N8N_INTEGRATION.md for setup instructions');
  }
}

// Run tests
runTests().catch(console.error);

