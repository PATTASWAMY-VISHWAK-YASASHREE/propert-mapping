/**
 * Simple Network Debug Tool
 * This script tests API connectivity without external dependencies
 */

const http = require('http');
const https = require('https');

// Configuration
const API_URL = 'http://localhost:5000/api';
const CHAT_API_URL = 'http://localhost:5003/api';
const FRONTEND_URL = 'http://localhost:3000';

console.log('='.repeat(50));
console.log('API Connectivity Test');
console.log('='.repeat(50));

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Test main API health endpoint
async function testMainAPI() {
  try {
    console.log('\nTesting Main API connection...');
    const response = await makeRequest(`${API_URL}/health`, {
      headers: {
        'Origin': FRONTEND_URL
      }
    });
    
    console.log('✅ Main API is accessible');
    console.log('Status Code:', response.statusCode);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check CORS headers
    const corsHeaders = response.headers['access-control-allow-origin'];
    if (corsHeaders) {
      console.log('✅ CORS headers are properly configured');
      console.log(`Access-Control-Allow-Origin: ${corsHeaders}`);
    } else {
      console.log('❌ CORS headers are missing');
      console.log('This will cause CORS errors in the browser');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Failed to connect to Main API');
    console.log('Error:', error.message);
    
    return false;
  }
}

// Test chat API health endpoint
async function testChatAPI() {
  try {
    console.log('\nTesting Chat API connection...');
    const response = await makeRequest(`${CHAT_API_URL}/health`, {
      headers: {
        'Origin': FRONTEND_URL
      }
    });
    
    console.log('✅ Chat API is accessible');
    console.log('Status Code:', response.statusCode);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check CORS headers
    const corsHeaders = response.headers['access-control-allow-origin'];
    if (corsHeaders) {
      console.log('✅ CORS headers are properly configured');
      console.log(`Access-Control-Allow-Origin: ${corsHeaders}`);
    } else {
      console.log('❌ CORS headers are missing');
      console.log('This will cause CORS errors in the browser');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Failed to connect to Chat API');
    console.log('Error:', error.message);
    
    return false;
  }
}

// Run all tests
async function runTests() {
  const mainApiResult = await testMainAPI();
  const chatApiResult = await testChatAPI();
  
  console.log('\n='.repeat(50));
  console.log('Test Results Summary');
  console.log('='.repeat(50));
  console.log(`Main API: ${mainApiResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Chat API: ${chatApiResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (!mainApiResult || !chatApiResult) {
    console.log('\nPossible solutions:');
    
    if (!mainApiResult) {
      console.log('1. Make sure the main server is running on port 5000');
      console.log('2. Check if the server has CORS properly configured');
      console.log('3. Verify that the /api/health endpoint is implemented');
    }
    
    if (!chatApiResult) {
      console.log('1. Make sure the chat server is running on port 5003');
      console.log('2. Check if the chat server has CORS properly configured');
      console.log('3. Verify that the /api/health endpoint is implemented');
    }
    
    console.log('\nGeneral troubleshooting:');
    console.log('1. Check if PostgreSQL is running');
    console.log('2. Verify that the database exists and has the required tables');
    console.log('3. Check the server logs for any errors');
    console.log('4. Make sure the frontend is using the correct API URLs');
  }
}

// Run the tests
runTests();