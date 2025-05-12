/**
 * Authentication Service
 * Handles authentication-related API requests
 */

import api from './api';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Response data
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Registration failed';
  }
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} mfaToken - MFA token (optional)
 * @returns {Promise<Object>} Response data
 */
export const login = async (email, password, mfaToken = null) => {
  try {
    const response = await api.post('/auth/login', { email, password, mfaToken });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Login failed';
  }
};

/**
 * Logout user
 * @returns {Promise<Object>} Response data
 */
export const logout = async () => {
  try {
    const response = await api.get('/auth/logout');
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Logout failed';
  }
};

/**
 * Get current user
 * @returns {Promise<Object>} User data
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to get user data';
  }
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<Object>} Response data
 */
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgotpassword', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to send reset email';
  }
};

/**
 * Reset password
 * @param {string} resetToken - Password reset token
 * @param {string} password - New password
 * @returns {Promise<Object>} Response data
 */
export const resetPassword = async (resetToken, password) => {
  try {
    const response = await api.put(`/auth/resetpassword/${resetToken}`, { password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to reset password';
  }
};

/**
 * Update password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Response data
 */
export const updatePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put('/auth/updatepassword', { currentPassword, newPassword });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to update password';
  }
};

/**
 * Setup MFA
 * @returns {Promise<Object>} MFA setup data
 */
export const setupMFA = async () => {
  try {
    const response = await api.post('/auth/mfa/setup');
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to setup MFA';
  }
};

/**
 * Verify MFA
 * @param {string} token - MFA token
 * @returns {Promise<Object>} Response data
 */
export const verifyMFA = async (token) => {
  try {
    const response = await api.post('/auth/mfa/verify', { token });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to verify MFA token';
  }
};