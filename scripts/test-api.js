#!/usr/bin/env node

/**
 * Manual test script for Phase 4 API layer
 * Run this to quickly validate API functionality
 */

const baseURL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Phase 4 API Layer...\n');

  // Test 1: API Info
  console.log('1. Testing GET /api/info...');
  try {
    const response = await fetch(`${baseURL}/api/info`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Info endpoint working');
      console.log(`   Name: ${data.name}`);
      console.log(`   Version: ${data.version}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Supported formats: ${data.supportedFormats?.join(', ')}`);
    } else {
      console.log('❌ API Info endpoint failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.log('❌ API Info endpoint error');
    console.log(`   Error: ${error.message}`);
  }

  console.log('');

  // Test 2: SDDirect file generation
  console.log('2. Testing POST /api/generate (SDDirect)...');
  try {
    const requestBody = {
      fileType: 'SDDirect',
      canInlineEdit: true,
      includeHeaders: true,
      numberOfRows: 5,
      hasInvalidRows: false,
      includeOptionalFields: true,
      outputPath: './test-output'
    };

    const response = await fetch(`${baseURL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ SDDirect generation working');
      console.log(`   Filename: ${data.data?.filename}`);
      console.log(`   Records: ${data.data?.metadata?.recordCount}`);
      console.log(`   Valid records: ${data.data?.metadata?.validRecords}`);
      console.log(`   Content length: ${data.data?.content?.length} characters`);
    } else {
      console.log('❌ SDDirect generation failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.log('❌ SDDirect generation error');
    console.log(`   Error: ${error.message}`);
  }

  console.log('');

  // Test 3: Bacs18PaymentLines file generation
  console.log('3. Testing POST /api/generate (Bacs18PaymentLines)...');
  try {
    const requestBody = {
      fileType: 'Bacs18PaymentLines',
      canInlineEdit: true,
      includeHeaders: false,
      numberOfRows: 3,
      hasInvalidRows: false,
      includeOptionalFields: false,
      outputPath: './test-output'
    };

    const response = await fetch(`${baseURL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Bacs18PaymentLines generation working');
      console.log(`   Filename: ${data.data?.filename}`);
      console.log(`   Records: ${data.data?.metadata?.recordCount}`);
      console.log(`   Content length: ${data.data?.content?.length} characters`);
    } else {
      console.log('❌ Bacs18PaymentLines generation failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.log('❌ Bacs18PaymentLines generation error');
    console.log(`   Error: ${error.message}`);
  }

  console.log('');

  // Test 4: Validation test
  console.log('4. Testing validation (invalid fileType)...');
  try {
    const requestBody = {
      fileType: 'InvalidType',
      numberOfRows: 5
    };

    const response = await fetch(`${baseURL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    if (response.status === 400 && !data.success) {
      console.log('✅ Validation working correctly');
      console.log(`   Error: ${data.error}`);
      console.log(`   Details: ${data.details}`);
    } else {
      console.log('❌ Validation test failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.log('❌ Validation test error');
    console.log(`   Error: ${error.message}`);
  }

  console.log('');

  // Test 5: Minimal request with defaults
  console.log('5. Testing minimal request with defaults...');
  try {
    const requestBody = {
      fileType: 'SDDirect'
    };

    const response = await fetch(`${baseURL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Default values working');
      console.log(`   Filename: ${data.data?.filename}`);
      console.log(`   Records: ${data.data?.metadata?.recordCount}`);
      console.log(`   Headers: ${data.data?.metadata?.hasHeaders}`);
    } else {
      console.log('❌ Default values test failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.log('❌ Default values test error');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n🏁 Phase 4 API testing completed!');
}

// Check if server is available first
async function checkServer() {
  try {
    const response = await fetch(`${baseURL}/api/info`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🚀 Phase 4 API Manual Test Suite\n');

  const serverAvailable = await checkServer();
  
  if (!serverAvailable) {
    console.log('❌ Server is not running on http://localhost:3000');
    console.log('   Please run: npm start');
    console.log('   Then run this test again\n');
    process.exit(1);
  }

  await testAPI();
}

main().catch(console.error);
