/**
 * Wealth Service
 * Handles wealth-related API requests
 */

import api from './api';

/**
 * Get owner wealth profile
 * @param {string} ownerId - Owner ID
 * @returns {Promise<Object>} Wealth profile
 */
export const getOwnerWealthProfile = async (ownerId) => {
  try {
    const response = await api.get(`/wealth/owners/${ownerId}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch wealth profile';
  }
};

/**
 * Compare wealth profiles
 * @param {Array<string>} ownerIds - Owner IDs to compare
 * @returns {Promise<Array>} Comparison data
 */
export const compareWealthProfiles = async (ownerIds) => {
  try {
    // Convert array to comma-separated string for query parameter
    const ownerIdsParam = Array.isArray(ownerIds) ? ownerIds.join(',') : ownerIds;
    
    const response = await api.get(`/wealth/compare?ownerIds=${ownerIdsParam}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to compare wealth profiles';
  }
};

/**
 * Get wealth statistics
 * @param {Object} params - Query parameters
 * @param {string} params.region - Region filter (state)
 * @param {string} params.propertyType - Property type filter
 * @returns {Promise<Object>} Wealth statistics
 */
export const getWealthStatistics = async (params = {}) => {
  try {
    const response = await api.get('/wealth/statistics', { params });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch wealth statistics';
  }
};

/**
 * Get property wealth insights
 * @param {string} propertyId - Property ID
 * @returns {Promise<Object>} Property wealth insights
 */
export const getPropertyWealthInsights = async (propertyId) => {
  try {
    const response = await api.get(`/wealth/property/${propertyId}/insights`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch property wealth insights';
  }
};