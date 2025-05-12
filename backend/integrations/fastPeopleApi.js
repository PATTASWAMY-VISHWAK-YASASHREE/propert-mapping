/**
 * Fast People Search API Integration
 * Provides individual information
 */

const axios = require('axios');
const config = require('../config/api-keys');

// Base URL for Fast People Search API
const BASE_URL = 'https://api.fastpeoplesearch.com/v1';

/**
 * Search people by name
 * @param {Object} params - Search parameters
 * @param {string} params.firstName - First name
 * @param {string} params.lastName - Last name
 * @param {string} params.city - City
 * @param {string} params.state - State
 * @param {number} params.age - Age
 * @returns {Promise<Array>} Search results
 */
exports.searchByName = async (params) => {
  try {
    const response = await axios.get(`${BASE_URL}/search/name`, {
      params: {
        ...params,
        api_key: config.FAST_PEOPLE_SEARCH_API_KEY
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error('Error searching people by name:', error);
    throw new Error('Failed to search people by name');
  }
};

/**
 * Search people by address
 * @param {Object} params - Search parameters
 * @param {string} params.street - Street address
 * @param {string} params.city - City
 * @param {string} params.state - State
 * @param {string} params.zipCode - ZIP code
 * @returns {Promise<Array>} Search results
 */
exports.searchByAddress = async (params) => {
  try {
    const response = await axios.get(`${BASE_URL}/search/address`, {
      params: {
        ...params,
        api_key: config.FAST_PEOPLE_SEARCH_API_KEY
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error('Error searching people by address:', error);
    throw new Error('Failed to search people by address');
  }
};

/**
 * Search people by phone
 * @param {string} phone - Phone number
 * @returns {Promise<Array>} Search results
 */
exports.searchByPhone = async (phone) => {
  try {
    const response = await axios.get(`${BASE_URL}/search/phone`, {
      params: {
        phone,
        api_key: config.FAST_PEOPLE_SEARCH_API_KEY
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error('Error searching people by phone:', error);
    throw new Error('Failed to search people by phone');
  }
};

/**
 * Search people by email
 * @param {string} email - Email address
 * @returns {Promise<Array>} Search results
 */
exports.searchByEmail = async (email) => {
  try {
    const response = await axios.get(`${BASE_URL}/search/email`, {
      params: {
        email,
        api_key: config.FAST_PEOPLE_SEARCH_API_KEY
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error('Error searching people by email:', error);
    throw new Error('Failed to search people by email');
  }
};

/**
 * Get person details
 * @param {string} personId - Person ID
 * @returns {Promise<Object>} Person details
 */
exports.getPersonDetails = async (personId) => {
  try {
    const response = await axios.get(`${BASE_URL}/person/${personId}`, {
      params: {
        api_key: config.FAST_PEOPLE_SEARCH_API_KEY
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching person details:', error);
    throw new Error('Failed to fetch person details');
  }
};

/**
 * Get person relatives
 * @param {string} personId - Person ID
 * @returns {Promise<Array>} Person relatives
 */
exports.getPersonRelatives = async (personId) => {
  try {
    const response = await axios.get(`${BASE_URL}/person/${personId}/relatives`, {
      params: {
        api_key: config.FAST_PEOPLE_SEARCH_API_KEY
      }
    });
    
    return response.data.relatives;
  } catch (error) {
    console.error('Error fetching person relatives:', error);
    throw new Error('Failed to fetch person relatives');
  }
};

/**
 * Get person associates
 * @param {string} personId - Person ID
 * @returns {Promise<Array>} Person associates
 */
exports.getPersonAssociates = async (personId) => {
  try {
    const response = await axios.get(`${BASE_URL}/person/${personId}/associates`, {
      params: {
        api_key: config.FAST_PEOPLE_SEARCH_API_KEY
      }
    });
    
    return response.data.associates;
  } catch (error) {
    console.error('Error fetching person associates:', error);
    throw new Error('Failed to fetch person associates');
  }
};

/**
 * Get person address history
 * @param {string} personId - Person ID
 * @returns {Promise<Array>} Address history
 */
exports.getPersonAddressHistory = async (personId) => {
  try {
    const response = await axios.get(`${BASE_URL}/person/${personId}/addresses`, {
      params: {
        api_key: config.FAST_PEOPLE_SEARCH_API_KEY
      }
    });
    
    return response.data.addresses;
  } catch (error) {
    console.error('Error fetching person address history:', error);
    throw new Error('Failed to fetch person address history');
  }
};

/**
 * Get person phone history
 * @param {string} personId - Person ID
 * @returns {Promise<Array>} Phone history
 */
exports.getPersonPhoneHistory = async (personId) => {
  try {
    const response = await axios.get(`${BASE_URL}/person/${personId}/phones`, {
      params: {
        api_key: config.FAST_PEOPLE_SEARCH_API_KEY
      }
    });
    
    return response.data.phones;
  } catch (error) {
    console.error('Error fetching person phone history:', error);
    throw new Error('Failed to fetch person phone history');
  }
};