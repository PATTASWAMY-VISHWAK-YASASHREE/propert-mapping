/**
 * API Test Module
 * Tests connection to backend API endpoints
 */

import axios from 'axios';

// Base API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Test API endpoints
const testApiEndpoints = async () => {
  console.log('Starting API connection tests...');
  console.log(`Testing API at: ${API_URL}`);
  
  try {
    // Test health endpoint
    console.log('\n--- Testing Health Endpoint ---');
    const healthResponse = await api.get('/health');
    console.log('Health endpoint response:', healthResponse.data);
    
    // Test authentication
    console.log('\n--- Testing Authentication ---');
    try {
      // Try to register a test user
      const registerData = {
        first_name: 'Test',
        last_name: 'User',
        email: `test${Date.now()}@example.com`,
        password: 'password123'
      };
      
      const registerResponse = await api.post('/auth/register', registerData);
      console.log('Register response:', registerResponse.data);
      
      // Set token for authenticated requests
      const token = registerResponse.data.token;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Get current user
      const meResponse = await api.get('/auth/me');
      console.log('Current user:', meResponse.data);
      
    } catch (error) {
      console.error('Authentication test failed:', error.response?.data || error.message);
      
      // Try to login with default credentials
      try {
        console.log('Trying to login with default credentials...');
        const loginResponse = await api.post('/auth/login', {
          email: 'admin@example.com',
          password: 'password123'
        });
        
        console.log('Login response:', loginResponse.data);
        
        // Set token for authenticated requests
        const token = loginResponse.data.token;
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (loginError) {
        console.error('Login failed:', loginError.response?.data || loginError.message);
      }
    }
    
    // Test chat endpoints
    console.log('\n--- Testing Chat Endpoints ---');
    try {
      const chatServerResponse = await api.get('/chat/servers');
      console.log('Chat server response:', chatServerResponse.data);
      
      if (chatServerResponse.data.success && chatServerResponse.data.data.channels?.length > 0) {
        const channelId = chatServerResponse.data.data.channels[0].id;
        console.log(`Testing messages for channel: ${channelId}`);
        
        const messagesResponse = await api.get(`/chat/channels/${channelId}/messages`);
        console.log('Messages response:', messagesResponse.data);
      }
    } catch (error) {
      console.error('Chat endpoints test failed:', error.response?.data || error.message);
    }
    
    console.log('\n--- API Tests Completed ---');
    return true;
  } catch (error) {
    console.error('API test failed:', error.response?.data || error.message);
    throw error;
  }
};

export default testApiEndpoints;