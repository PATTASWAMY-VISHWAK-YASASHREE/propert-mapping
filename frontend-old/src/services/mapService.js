/**
 * Map Service
 * Handles map-related API requests
 */

import api from './api';

/**
 * Get properties for map
 * @param {Object} params - Query parameters
 * @param {string} params.bounds - Map bounds (format: "lat1,lng1,lat2,lng2")
 * @param {number} params.zoom - Map zoom level
 * @param {string} params.propertyType - Property type filter
 * @param {number} params.minValue - Minimum property value
 * @param {number} params.maxValue - Maximum property value
 * @param {number} params.minSize - Minimum property size
 * @param {number} params.maxSize - Maximum property size
 * @param {number} params.ownerWealthMin - Minimum owner wealth
 * @param {number} params.ownerWealthMax - Maximum owner wealth
 * @returns {Promise<Array>} Properties within bounds
 */
export const getMapProperties = async (params) => {
  try {
    const response = await api.get('/map/properties', { params });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch map properties';
  }
};

/**
 * Get property clusters for map
 * @param {Object} params - Query parameters
 * @param {string} params.bounds - Map bounds (format: "lat1,lng1,lat2,lng2")
 * @param {number} params.zoom - Map zoom level
 * @param {string} params.propertyType - Property type filter
 * @returns {Promise<Array>} Property clusters
 */
export const getPropertyClusters = async (params) => {
  try {
    const response = await api.get('/map/clusters', { params });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch property clusters';
  }
};

/**
 * Save map view
 * @param {Object} viewData - Map view data
 * @param {string} viewData.name - View name
 * @param {string} viewData.description - View description (optional)
 * @param {Object} viewData.center - Map center coordinates
 * @param {number} viewData.zoom - Map zoom level
 * @param {Object} viewData.filters - Map filters
 * @returns {Promise<Object>} Saved map view
 */
export const saveMapView = async (viewData) => {
  try {
    const response = await api.post('/map/views', viewData);
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to save map view';
  }
};

/**
 * Get saved map views
 * @returns {Promise<Array>} Saved map views
 */
export const getSavedMapViews = async () => {
  try {
    const response = await api.get('/map/views');
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch saved map views';
  }
};

/**
 * Delete saved map view
 * @param {string} id - Map view ID
 * @returns {Promise<Object>} Response data
 */
export const deleteMapView = async (id) => {
  try {
    const response = await api.delete(`/map/views/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to delete map view';
  }
};

/**
 * Get address suggestions
 * @param {string} query - Search query
 * @returns {Promise<Array>} Address suggestions
 */
export const getAddressSuggestions = async (query) => {
  try {
    const response = await api.get('/map/address-suggestions', { params: { query } });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch address suggestions';
  }
};

/**
 * Geocode address
 * @param {string} address - Address to geocode
 * @returns {Promise<Object>} Geocoded location
 */
export const geocodeAddress = async (address) => {
  try {
    const response = await api.get('/map/geocode', { params: { address } });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to geocode address';
  }
};