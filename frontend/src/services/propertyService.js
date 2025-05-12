/**
 * Property Service
 * Handles property-related API requests
 */

import api from './api';

/**
 * Get properties
 * @param {Object} params - Query parameters
 * @param {string} params.select - Fields to select
 * @param {string} params.sort - Sort fields
 * @param {number} params.page - Page number
 * @param {number} params.limit - Results per page
 * @returns {Promise<Object>} Properties with pagination
 */
export const getProperties = async (params = {}) => {
  try {
    const response = await api.get('/properties', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch properties';
  }
};

/**
 * Get property by ID
 * @param {string} id - Property ID
 * @returns {Promise<Object>} Property data
 */
export const getProperty = async (id) => {
  try {
    const response = await api.get(`/properties/${id}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch property';
  }
};

/**
 * Create property
 * @param {Object} propertyData - Property data
 * @returns {Promise<Object>} Created property
 */
export const createProperty = async (propertyData) => {
  try {
    const response = await api.post('/properties', propertyData);
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to create property';
  }
};

/**
 * Update property
 * @param {string} id - Property ID
 * @param {Object} propertyData - Property data
 * @returns {Promise<Object>} Updated property
 */
export const updateProperty = async (id, propertyData) => {
  try {
    const response = await api.put(`/properties/${id}`, propertyData);
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to update property';
  }
};

/**
 * Delete property
 * @param {string} id - Property ID
 * @returns {Promise<Object>} Response data
 */
export const deleteProperty = async (id) => {
  try {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to delete property';
  }
};

/**
 * Get property history
 * @param {string} id - Property ID
 * @returns {Promise<Array>} Property history
 */
export const getPropertyHistory = async (id) => {
  try {
    const response = await api.get(`/properties/${id}/history`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch property history';
  }
};

/**
 * Bookmark property
 * @param {string} propertyId - Property ID
 * @param {string} notes - Bookmark notes (optional)
 * @returns {Promise<Object>} Response data
 */
export const bookmarkProperty = async (propertyId, notes = '') => {
  try {
    const response = await api.post('/properties/bookmark', { propertyId, notes });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to bookmark property';
  }
};

/**
 * Remove bookmark
 * @param {string} propertyId - Property ID
 * @returns {Promise<Object>} Response data
 */
export const removeBookmark = async (propertyId) => {
  try {
    const response = await api.delete(`/properties/bookmark/${propertyId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to remove bookmark';
  }
};

/**
 * Get bookmarked properties
 * @returns {Promise<Array>} Bookmarked properties
 */
export const getBookmarkedProperties = async () => {
  try {
    const response = await api.get('/properties/bookmarks');
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch bookmarked properties';
  }
};