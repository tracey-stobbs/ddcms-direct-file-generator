/**
 * Simple test script for the API
 */
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`BODY: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Send the request body
const requestData = JSON.stringify({
  fileType: 'SDDirect',
  numberOfRows: 10,
  includeHeaders: true,
  includeOptionalFields: true,
  hasInvalidRows: false
});

req.write(requestData);
req.end();
