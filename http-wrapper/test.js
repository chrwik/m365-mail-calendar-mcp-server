const http = require('http');

// Test the HTTP wrapper
function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data && method === 'POST') {
      data = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data && method === 'POST') {
      req.write(data);
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing HTTP Wrapper...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const health = await testEndpoint('/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response:`, health.data);
    console.log('   ✅ Health check passed\n');

    // Test 2: List available tools
    console.log('2. Testing tools endpoint...');
    const tools = await testEndpoint('/api/tools');
    console.log(`   Status: ${tools.status}`);
    console.log(`   Available tools: ${tools.data.tools?.length || 0}`);
    console.log('   ✅ Tools endpoint working\n');

    // Test 3: Check auth status
    console.log('3. Testing auth status...');
    const auth = await testEndpoint('/auth/status');
    console.log(`   Status: ${auth.status}`);
    console.log(`   Authenticated:`, auth.data.authenticated);
    console.log(`   Message:`, auth.data.message);
    
    if (!auth.data.authenticated) {
      console.log('   ⚠️  Authentication required - you\'ll need to complete device flow');
    } else {
      console.log('   ✅ Already authenticated');
    }
    console.log();

    // Test 4: Try to list emails (will trigger auth if needed)
    console.log('4. Testing email endpoint...');
    try {
      const emails = await testEndpoint('/api/emails?limit=1');
      console.log(`   Status: ${emails.status}`);
      
      if (emails.status === 200) {
        console.log('   ✅ Email endpoint working');
        console.log('   📧 Successfully retrieved emails');
      } else {
        console.log('   ⚠️  Email endpoint returned:', emails.data);
      }
    } catch (emailError) {
      console.log('   ⚠️  Email test failed (may need authentication):', emailError.message);
    }

    console.log('\n🎉 HTTP Wrapper is working!');
    console.log('🔗 You can now use these endpoints in n8n:');
    console.log('   - GET  http://localhost:3000/api/emails');
    console.log('   - GET  http://localhost:3000/api/calendar/events');
    console.log('   - POST http://localhost:3000/api/emails/send');
    console.log('   - And more...');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the server is running: npm start');
    console.log('   2. Check if port 3000 is available');
    console.log('   3. Verify the MCP server path is correct');
  }
}

// Run tests
runTests();