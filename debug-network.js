/**
 * Network Debug Tool
 * This script tests API connectivity and CORS configuration
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const API_URL = 'http://localhost:5000/api';
const CHAT_API_URL = 'http://localhost:5003/api';
const FRONTEND_URL = 'http://localhost:3000';

console.log('='.repeat(50));
console.log('API Connectivity Test'.yellow.bold);
console.log('='.repeat(50));

// Test main API health endpoint
async function testMainAPI() {
  try {
    console.log('\nTesting Main API connection...'.cyan);
    const response = await axios.get(`${API_URL}/health`, {
      headers: {
        'Origin': FRONTEND_URL
      }
    });
    
    console.log('✅ Main API is accessible'.green);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check CORS headers
    const corsHeaders = response.headers['access-control-allow-origin'];
    if (corsHeaders) {
      console.log('✅ CORS headers are properly configured'.green);
      console.log(`Access-Control-Allow-Origin: ${corsHeaders}`);
    } else {
      console.log('❌ CORS headers are missing'.red);
      console.log('This will cause CORS errors in the browser');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Failed to connect to Main API'.red);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.log(`Status: ${error.response.status}`);
      console.log('Response:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received from server. Is the server running?');
    } else {
      // Something happened in setting up the request
      console.log('Error:', error.message);
    }
    
    return false;
  }
}

// Test chat API health endpoint
async function testChatAPI() {
  try {
    console.log('\nTesting Chat API connection...'.cyan);
    const response = await axios.get(`${CHAT_API_URL}/health`, {
      headers: {
        'Origin': FRONTEND_URL
      }
    });
    
    console.log('✅ Chat API is accessible'.green);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check CORS headers
    const corsHeaders = response.headers['access-control-allow-origin'];
    if (corsHeaders) {
      console.log('✅ CORS headers are properly configured'.green);
      console.log(`Access-Control-Allow-Origin: ${corsHeaders}`);
    } else {
      console.log('❌ CORS headers are missing'.red);
      console.log('This will cause CORS errors in the browser');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Failed to connect to Chat API'.red);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.log(`Status: ${error.response.status}`);
      console.log('Response:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received from server. Is the server running?');
    } else {
      // Something happened in setting up the request
      console.log('Error:', error.message);
    }
    
    return false;
  }
}

// Test registration endpoint
async function testRegistration() {
  try {
    console.log('\nTesting registration endpoint...'.cyan);
    
    // First, check if the endpoint is accessible with OPTIONS (CORS preflight)
    try {
      await axios({
        method: 'OPTIONS',
        url: `${API_URL}/auth/register`,
        headers: {
          'Origin': FRONTEND_URL,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      console.log('✅ CORS preflight request successful'.green);
    } catch (error) {
      console.log('❌ CORS preflight request failed'.red);
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
      } else {
        console.log('Error:', error.message);
      }
    }
    
    // Generate a random email to avoid conflicts
    const randomEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
    
    // Try to register a test user
    const response = await axios.post(`${API_URL}/auth/register`, {
      first_name: 'Test',
      last_name: 'User',
      email: randomEmail,
      password: 'password123'
    }, {
      headers: {
        'Origin': FRONTEND_URL,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration endpoint is working'.green);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.log('❌ Registration endpoint test failed'.red);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.log(`Status: ${error.response.status}`);
      console.log('Response:', error.response.data);
      
      // Check for specific error messages
      if (error.response.status === 400 && error.response.data.error === 'Email already in use') {
        console.log('This is expected if the email is already registered'.yellow);
        return true;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received from server');
    } else {
      // Something happened in setting up the request
      console.log('Error:', error.message);
    }
    
    return false;
  }
}

// Run all tests
async function runTests() {
  const mainApiResult = await testMainAPI();
  const chatApiResult = await testChatAPI();
  const registrationResult = await testRegistration();
  
  console.log('\n='.repeat(50));
  console.log('Test Results Summary'.yellow.bold);
  console.log('='.repeat(50));
  console.log(`Main API: ${mainApiResult ? '✅ PASSED'.green : '❌ FAILED'.red}`);
  console.log(`Chat API: ${chatApiResult ? '✅ PASSED'.green : '❌ FAILED'.red}`);
  console.log(`Registration: ${registrationResult ? '✅ PASSED'.green : '❌ FAILED'.red}`);
  
  if (!mainApiResult || !chatApiResult || !registrationResult) {
    console.log('\nPossible solutions:'.yellow);
    
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
    
    if (!registrationResult) {
      console.log('1. Check if the database is properly connected');
      console.log('2. Verify that the registration endpoint is implemented correctly');
      console.log('3. Make sure CORS is configured to allow POST requests');
    }
    
    console.log('\nGeneral troubleshooting:'.yellow);
    console.log('1. Check if PostgreSQL is running');
    console.log('2. Verify that the database exists and has the required tables');
    console.log('3. Check the server logs for any errors');
    console.log('4. Make sure the frontend is using the correct API URLs');
  }
}

// Run the tests
runTests();