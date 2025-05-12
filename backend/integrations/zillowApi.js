/**
 * Zillow API Integration
 * Provides property valuation data
 */

const axios = require('axios');
const config = require('../config/api-keys');

// Base URL for Zillow API
const BASE_URL = 'https://api.zillow.com/v2';

/**
 * Get property valuation
 * @param {Object} address - Property address
 * @param {string} address.street - Street address
 * @param {string} address.city - City
 * @param {string} address.state - State
 * @param {string} address.zipCode - ZIP code
 * @returns {Promise<Object>} Property valuation data
 */
exports.getPropertyValuation = async (address) => {
  try {
    const { street, city, state, zipCode } = address;
    
    const response = await axios.get(`${BASE_URL}/homes/valuation`, {
      params: {
        address: street,
        citystatezip: `${city}, ${state} ${zipCode}`,
        api_key: config.ZILLOW_API_KEY
      }
    });
    
    return {
      zestimate: response.data.zestimate,
      rentZestimate: response.data.rentZestimate,
      lastUpdated: response.data.lastUpdated,
      valueRange: response.data.valueRange,
      zpid: response.data.zpid
    };
  } catch (error) {
    console.error('Error fetching property valuation:', error);
    throw new Error('Failed to fetch property valuation from Zillow');
  }
};

/**
 * Get property details
 * @param {string} zpid - Zillow property ID
 * @returns {Promise<Object>} Property details
 */
exports.getPropertyDetails = async (zpid) => {
  try {
    const response = await axios.get(`${BASE_URL}/homes/details`, {
      params: {
        zpid,
        api_key: config.ZILLOW_API_KEY
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching property details:', error);
    throw new Error('Failed to fetch property details from Zillow');
  }
};

/**
 * Search properties
 * @param {Object} params - Search parameters
 * @param {string} params.location - Location (city, state or ZIP code)
 * @param {number} params.minPrice - Minimum price
 * @param {number} params.maxPrice - Maximum price
 * @param {number} params.minBeds - Minimum bedrooms
 * @param {number} params.maxBeds - Maximum bedrooms
 * @param {number} params.minBaths - Minimum bathrooms
 * @param {number} params.maxBaths - Maximum bathrooms
 * @returns {Promise<Array>} Search results
 */
exports.searchProperties = async (params) => {
  try {
    const response = await axios.get(`${BASE_URL}/homes/search`, {
      params: {
        ...params,
        api_key: config.ZILLOW_API_KEY
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error('Error searching properties:', error);
    throw new Error('Failed to search properties on Zillow');
  }
};

/**
 * Get property images
 * @param {string} zpid - Zillow property ID
 * @returns {Promise<Array>} Property images
 */
exports.getPropertyImages = async (zpid) => {
  try {
    const response = await axios.get(`${BASE_URL}/homes/photos`, {
      params: {
        zpid,
        api_key: config.ZILLOW_API_KEY
      }
    });
    
    return response.data.photos;
  } catch (error) {
    console.error('Error fetching property images:', error);
    throw new Error('Failed to fetch property images from Zillow');
  }
};

/**
 * Get property market trends
 * @param {string} regionId - Zillow region ID (city, ZIP code, etc.)
 * @param {string} regionType - Region type (city, zip, neighborhood, etc.)
 * @returns {Promise<Object>} Market trends data
 */
exports.getMarketTrends = async (regionId, regionType) => {
  try {
    const response = await axios.get(`${BASE_URL}/market/trends`, {
      params: {
        regionId,
        regionType,
        api_key: config.ZILLOW_API_KEY
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching market trends:', error);
    throw new Error('Failed to fetch market trends from Zillow');
  }
};

/**
 * Get comparable properties
 * @param {string} zpid - Zillow property ID
 * @param {number} count - Number of comparable properties to return
 * @returns {Promise<Array>} Comparable properties
 */
exports.getComparableProperties = async (zpid, count = 10) => {
  try {
    const response = await axios.get(`${BASE_URL}/homes/comps`, {
      params: {
        zpid,
        count,
        api_key: config.ZILLOW_API_KEY
      }
    });
    
    return response.data.comparables;
  } catch (error) {
    console.error('Error fetching comparable properties:', error);
    throw new Error('Failed to fetch comparable properties from Zillow');
  }
};

/**
 * Get property tax history
 * @param {string} zpid - Zillow property ID
 * @returns {Promise<Array>} Tax history
 */
exports.getPropertyTaxHistory = async (zpid) => {
  try {
    const response = await axios.get(`${BASE_URL}/homes/tax-history`, {
      params: {
        zpid,
        api_key: config.ZILLOW_API_KEY
      }
    });
    
    return response.data.taxHistory;
  } catch (error) {
    console.error('Error fetching property tax history:', error);
    throw new Error('Failed to fetch property tax history from Zillow');
  }
};