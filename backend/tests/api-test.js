/**
 * API Test Script
 * Tests various API endpoints
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

// Test endpoints
const endpoints = [
  { name: 'Health Check', path: '/health', method: 'get' },
  { name: 'Authentication Status', path: '/auth/me', method: 'get', requiresAuth: true },
  // Add more endpoints to test as needed
];

/**
 * Format response for display
 * @param {Object} response - Axios response
 * @returns {string} - Formatted response
 */
const formatResponse = (response) => {
  if (!response) return 'No response';
  
  const { status, statusText, headers, data } = response;
  
  return {
    status,
    statusText,
    contentType: headers['content-type'],
    data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
  };
};

/**
 * Test an endpoint
 * @param {Object} endpoint - Endpoint configuration
 */
const testEndpoint = async (endpoint) => {
  console.log(`\nTesting ${endpoint.name.bold} (${endpoint.path})...`);
  
  try {
    const config = {
      headers: {}
    };
    
    // Add auth token if required
    if (endpoint.requiresAuth && AUTH_TOKEN) {
      config.headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }
    
    // Make the request
    const response = await axios({
      method: endpoint.method,
      url: `${API_URL}${endpoint.path}`,
      ...config
    });
    
    // Format and display response
    const formattedResponse = formatResponse(response);
    console.log('Status:'.green, formattedResponse.status, formattedResponse.statusText);
    console.log('Content-Type:'.green, formattedResponse.contentType);
    console.log('Response Data:'.green);
    console.log(formattedResponse.data);
    
    return true;
  } catch (error) {
    console.log('Error:'.red, error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const formattedResponse = formatResponse(error.response);
      console.log('Status:'.yellow, formattedResponse.status, formattedResponse.statusText);
      console.log('Content-Type:'.yellow, formattedResponse.contentType);
      console.log('Response Data:'.yellow);
      console.log(formattedResponse.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received from server'.red);
      console.log('Request:'.yellow, error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error setting up request:'.red, error.message);
    }
    
    return false;
  }
};

/**
 * Run all tests
 */
const runTests = async () => {
  console.log('Starting API tests...'.cyan.bold);
  console.log(`API URL: ${API_URL}`.cyan);
  
  let passed = 0;
  let failed = 0;
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\nTest Results:'.cyan.bold);
  console.log(`Passed: ${passed}`.green);
  console.log(`Failed: ${failed}`.red);
  console.log(`Total: ${endpoints.length}`.cyan);
};

// Run tests
runTests().catch(error => {
  console.error('Test runner error:'.red, error);
  process.exit(1);
});