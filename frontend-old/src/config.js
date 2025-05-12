/**
 * Application Configuration
 */

// API URL based on environment
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// OpenCage Geocoding API key
export const OPENCAGE_API_KEY = process.env.REACT_APP_OPENCAGE_API_KEY || 'e48401af8b9d4b32bab93dbdd4aede28';

// Map configuration
export const MAP_CONFIG = {
  defaultCenter: {
    lat: 37.7749,
    lng: -122.4194
  },
  defaultZoom: 12,
  minZoom: 3,
  maxZoom: 18
};

// Authentication configuration
export const AUTH_CONFIG = {
  tokenKey: 'token',
  tokenExpire: 30 // days
};

// UI configuration
export const UI_CONFIG = {
  snackbarAutoHideDuration: 5000,
  tableRowsPerPageOptions: [10, 25, 50, 100],
  defaultTableRowsPerPage: 25
};

/**
 * API Feature Configuration
 * Maps features to their required environment variables
 */
export const API_FEATURES = {
  chat: 'REACT_APP_CHAT_API_KEY',
  geocoding: 'REACT_APP_OPENCAGE_API_KEY',
  maps: 'REACT_APP_MAPS_API_KEY',
  analytics: 'REACT_APP_ANALYTICS_KEY'
};

/**
 * Check if a feature is available based on its API key in environment variables
 * @param {string} featureName - Name of the feature to check
 * @returns {boolean} - Whether the feature is available
 */
export const isFeatureEnabled = (featureName) => {
  const apiKey = API_FEATURES[featureName];
  if (!apiKey) return true; // If no API key is required, feature is enabled by default
  
  const value = process.env[apiKey];
  return value !== undefined && value !== null && value !== '';
};