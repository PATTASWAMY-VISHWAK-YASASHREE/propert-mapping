/**
 * API Service
 * Handles API requests to the backend
 */

import axios from 'axios';
import { isFeatureEnabled } from '../config';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 10000 // 10 seconds timeout
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshResponse = await axios.post('/api/auth/refresh-token', {}, {
          baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
          withCredentials: true
        });
        
        if (refreshResponse.data.success) {
          // Update token
          localStorage.setItem('token', refreshResponse.data.token);
          
          // Update authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${refreshResponse.data.token}`;
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
          
          // Retry original request
          return axios(originalRequest);
        } else {
          // If refresh fails, logout
          localStorage.removeItem('token');
          window.location.href = '/login';
          return Promise.reject({ success: false, error: 'Session expired' });
        }
      } catch (refreshError) {
        // If refresh fails, logout
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject({ success: false, error: 'Session expired' });
      }
    }
    
    // Network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject({ 
        success: false, 
        error: 'Network error. Please check your connection.' 
      });
    }
    
    // Server errors (500+)
    if (error.response.status >= 500) {
      console.error('Server Error:', error.response.data);
      return Promise.reject({ 
        success: false, 
        error: 'Server error. Please try again later.' 
      });
    }
    
    // Return error response data or error message
    return Promise.reject(
      (error.response && error.response.data) || 
      { success: false, error: error.message || 'Unknown error' }
    );
  }
);

/**
 * Check if an endpoint requires a specific API feature
 * @param {string} url - API endpoint
 * @returns {string|null} - Feature name if endpoint requires a specific feature, null otherwise
 */
const getRequiredFeatureForEndpoint = (url) => {
  if (url.includes('/face') || url.includes('/swap')) {
    return 'faceSwap';
  }
  if (url.includes('/chat')) {
    return 'chat';
  }
  if (url.includes('/geocode') || url.includes('/location')) {
    return 'geocoding';
  }
  if (url.includes('/maps') || url.includes('/directions')) {
    return 'maps';
  }
  if (url.includes('/analytics')) {
    return 'analytics';
  }
  return null;
};

/**
 * Check if an endpoint is available based on required API keys
 * @param {string} url - API endpoint
 * @returns {boolean} - Whether the endpoint is available
 */
const isEndpointAvailable = (url) => {
  const requiredFeature = getRequiredFeatureForEndpoint(url);
  if (!requiredFeature) return true; // If no specific feature is required, endpoint is available
  return isFeatureEnabled(requiredFeature);
};

/**
 * Generic API methods
 */
const apiService = {
  /**
   * GET request
   * @param {string} url - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response
   */
  get: (url, params = {}) => {
    console.log(`API GET: ${url}`, params);
    
    // Check if endpoint is available
    if (!isEndpointAvailable(url)) {
      console.warn(`API endpoint ${url} is disabled due to missing API key`);
      return Promise.resolve({ 
        success: false, 
        error: 'This feature is disabled due to missing API configuration',
        disabled: true
      });
    }
    
    return api.get(url, { params })
      .then(response => {
        console.log(`API GET Response: ${url}`, response);
        return response;
      })
      .catch(error => {
        console.error(`API GET Error: ${url}`, error);
        throw error;
      });
  },
  
  /**
   * POST request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise} - API response
   */
  post: (url, data = {}) => {
    console.log(`API POST: ${url}`, data);
    
    // Check if endpoint is available
    if (!isEndpointAvailable(url)) {
      console.warn(`API endpoint ${url} is disabled due to missing API key`);
      return Promise.resolve({ 
        success: false, 
        error: 'This feature is disabled due to missing API configuration',
        disabled: true
      });
    }
    
    // Add debug headers for CORS troubleshooting
    const headers = {};
    
    return api.post(url, data, { headers })
      .then(response => {
        console.log(`API POST Response: ${url}`, response);
        return response;
      })
      .catch(error => {
        // Enhanced error logging for debugging
        console.error(`API POST Error: ${url}`, error);
        
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
          console.error('Response data:', error.response.data);
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Error setting up request:', error.message);
        }
        
        throw error;
      });
  },
  
  /**
   * PUT request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise} - API response
   */
  put: (url, data = {}) => {
    console.log(`API PUT: ${url}`, data);
    
    // Check if endpoint is available
    if (!isEndpointAvailable(url)) {
      console.warn(`API endpoint ${url} is disabled due to missing API key`);
      return Promise.resolve({ 
        success: false, 
        error: 'This feature is disabled due to missing API configuration',
        disabled: true
      });
    }
    
    return api.put(url, data)
      .then(response => {
        console.log(`API PUT Response: ${url}`, response);
        return response;
      })
      .catch(error => {
        console.error(`API PUT Error: ${url}`, error);
        throw error;
      });
  },
  
  /**
   * DELETE request
   * @param {string} url - API endpoint
   * @returns {Promise} - API response
   */
  delete: (url) => {
    console.log(`API DELETE: ${url}`);
    
    // Check if endpoint is available
    if (!isEndpointAvailable(url)) {
      console.warn(`API endpoint ${url} is disabled due to missing API key`);
      return Promise.resolve({ 
        success: false, 
        error: 'This feature is disabled due to missing API configuration',
        disabled: true
      });
    }
    
    return api.delete(url)
      .then(response => {
        console.log(`API DELETE Response: ${url}`, response);
        return response;
      })
      .catch(error => {
        console.error(`API DELETE Error: ${url}`, error);
        throw error;
      });
  },
  
  /**
   * Upload file
   * @param {string} url - API endpoint
   * @param {FormData} formData - Form data with file
   * @param {Function} onProgress - Progress callback
   * @returns {Promise} - API response
   */
  upload: (url, formData, onProgress) => {
    console.log(`API UPLOAD: ${url}`);
    
    // Check if endpoint is available
    if (!isEndpointAvailable(url)) {
      console.warn(`API endpoint ${url} is disabled due to missing API key`);
      return Promise.resolve({ 
        success: false, 
        error: 'This feature is disabled due to missing API configuration',
        disabled: true
      });
    }
    
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress ? 
        progressEvent => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        } : undefined
    })
    .then(response => {
      console.log(`API UPLOAD Response: ${url}`, response);
      return response;
    })
    .catch(error => {
      console.error(`API UPLOAD Error: ${url}`, error);
      throw error;
    });
  },
  
  /**
   * Check API health
   * @returns {Promise} - API health status
   */
  checkHealth: () => {
    return api.get('/health');
  },
  
  /**
   * Check if an endpoint is available based on required API keys
   * @param {string} url - API endpoint
   * @returns {boolean} - Whether the endpoint is available
   */
  isEndpointAvailable,
  
  /**
   * Get API instance
   * @returns {Object} - Axios instance
   */
  getInstance: () => api
};

export default apiService;