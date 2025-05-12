/**
 * Authentication Service
 * Handles user authentication and token management
 */

import apiService from './api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * Authentication Service
 */
const authService = {
  /**
   * Login user
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} - Login response
   */
  async login(credentials) {
    try {
      const response = await apiService.post('/auth/login', credentials);
      
      if (response.success) {
        localStorage.setItem(TOKEN_KEY, response.token);
        
        // Get user info
        const userResponse = await this.getCurrentUser();
        
        if (userResponse.success) {
          localStorage.setItem(USER_KEY, JSON.stringify(userResponse.data));
        }
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  /**
   * Register user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Registration response
   */
  async register(userData) {
    try {
      const response = await apiService.post('/auth/register', userData);
      
      if (response.success) {
        localStorage.setItem(TOKEN_KEY, response.token);
        
        // Get user info
        const userResponse = await this.getCurrentUser();
        
        if (userResponse.success) {
          localStorage.setItem(USER_KEY, JSON.stringify(userResponse.data));
        }
      }
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  /**
   * Logout user
   * @returns {Promise<Object>} - Logout response
   */
  async logout() {
    try {
      const response = await apiService.get('/auth/logout');
      
      // Clear local storage regardless of response
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      
      return response;
    } catch (error) {
      // Clear local storage even if logout fails
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  /**
   * Get current user
   * @returns {Promise<Object>} - User data
   */
  async getCurrentUser() {
    try {
      return await apiService.get('/auth/me');
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
  
  /**
   * Check if user is authenticated
   * @returns {boolean} - True if authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },
  
  /**
   * Get authentication token
   * @returns {string|null} - Authentication token
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  /**
   * Get current user from local storage
   * @returns {Object|null} - User data
   */
  getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  
  /**
   * Refresh authentication token
   * @returns {Promise<Object>} - Refresh response
   */
  async refreshToken() {
    try {
      const response = await apiService.post('/auth/refresh-token');
      
      if (response.success) {
        localStorage.setItem(TOKEN_KEY, response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  }
};

export default authService;