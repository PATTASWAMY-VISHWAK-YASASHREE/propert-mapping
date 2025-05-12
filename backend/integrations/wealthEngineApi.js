/**
 * Wealth Engine API Integration
 * Provides wealth data for individuals and organizations
 */

const axios = require('axios');
const config = require('../config/api-keys');

// Base URL for Wealth Engine API
const BASE_URL = 'https://api.wealthengine.com/v1';

/**
 * Get wealth profile for an individual or entity
 * @param {Object} ownerData - Owner data
 * @param {string} ownerData.type - Owner type ('individual' or 'entity')
 * @param {string} ownerData.name - Owner name
 * @param {Object} ownerData.address - Owner address
 * @returns {Promise<Object>} Wealth profile data
 */
exports.getWealthProfile = async (ownerData) => {
  try {
    const { type, name, address } = ownerData;
    
    // Build request payload based on owner type
    const payload = type === 'individual' 
      ? buildIndividualPayload(name, address)
      : buildEntityPayload(name, address);
    
    const response = await axios.post(`${BASE_URL}/profile/find`, payload, {
      headers: {
        'Authorization': `APIKey ${config.WEALTH_ENGINE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Process and return the wealth data
    return processWealthData(response.data);
  } catch (error) {
    console.error('Error fetching wealth profile:', error);
    throw new Error('Failed to fetch wealth profile from Wealth Engine');
  }
};

/**
 * Get batch wealth profiles for multiple individuals or entities
 * @param {Array} owners - Array of owner data objects
 * @returns {Promise<Array>} Array of wealth profiles
 */
exports.getBatchWealthProfiles = async (owners) => {
  try {
    // Build batch request payload
    const payload = {
      batch: owners.map(owner => {
        return owner.type === 'individual'
          ? buildIndividualPayload(owner.name, owner.address)
          : buildEntityPayload(owner.name, owner.address);
      })
    };
    
    const response = await axios.post(`${BASE_URL}/profile/batch`, payload, {
      headers: {
        'Authorization': `APIKey ${config.WEALTH_ENGINE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Process and return the batch results
    return response.data.map(result => processWealthData(result));
  } catch (error) {
    console.error('Error fetching batch wealth profiles:', error);
    throw new Error('Failed to fetch batch wealth profiles from Wealth Engine');
  }
};

/**
 * Get wealth insights for a specific property
 * @param {Object} propertyData - Property data
 * @param {string} propertyData.address - Property address
 * @param {number} propertyData.value - Property value
 * @returns {Promise<Object>} Property wealth insights
 */
exports.getPropertyWealthInsights = async (propertyData) => {
  try {
    const { address, value } = propertyData;
    
    const payload = {
      address: {
        address1: address.street,
        city: address.city,
        state: address.state,
        zip: address.zipCode
      },
      propertyValue: value
    };
    
    const response = await axios.post(`${BASE_URL}/property/insights`, payload, {
      headers: {
        'Authorization': `APIKey ${config.WEALTH_ENGINE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching property wealth insights:', error);
    throw new Error('Failed to fetch property wealth insights from Wealth Engine');
  }
};

/**
 * Get wealth screening for a list of individuals
 * @param {Array} individuals - Array of individual data
 * @returns {Promise<Object>} Wealth screening results
 */
exports.getWealthScreening = async (individuals) => {
  try {
    const payload = {
      individuals: individuals.map(individual => ({
        name: {
          first: individual.firstName,
          last: individual.lastName
        },
        address: {
          address1: individual.address.street,
          city: individual.address.city,
          state: individual.address.state,
          zip: individual.address.zipCode
        }
      }))
    };
    
    const response = await axios.post(`${BASE_URL}/screening`, payload, {
      headers: {
        'Authorization': `APIKey ${config.WEALTH_ENGINE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error performing wealth screening:', error);
    throw new Error('Failed to perform wealth screening with Wealth Engine');
  }
};

/**
 * Helper function to build payload for individual profiles
 * @param {string} name - Individual's full name
 * @param {Object} address - Individual's address
 * @returns {Object} Formatted payload
 */
const buildIndividualPayload = (name, address) => {
  // Parse name into first and last
  const nameParts = name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  
  return {
    name: {
      first: firstName,
      last: lastName
    },
    address: {
      address1: address.street,
      city: address.city,
      state: address.state,
      zip: address.zipCode
    }
  };
};

/**
 * Helper function to build payload for entity profiles
 * @param {string} name - Entity name
 * @param {Object} address - Entity address
 * @returns {Object} Formatted payload
 */
const buildEntityPayload = (name, address) => {
  return {
    organization: {
      name: name
    },
    address: {
      address1: address.street,
      city: address.city,
      state: address.state,
      zip: address.zipCode
    }
  };
};

/**
 * Process and normalize wealth data from API response
 * @param {Object} data - Raw API response data
 * @returns {Object} Processed wealth data
 */
const processWealthData = (data) => {
  // If no data or error in response, return null
  if (!data || data.error) {
    return null;
  }
  
  // Extract and normalize the wealth data
  const wealthData = {
    netWorth: data.wealth?.netWorth || 0,
    confidenceScore: data.confidence || 0,
    composition: {
      realEstate: {
        value: data.wealth?.realEstate?.total || 0,
        percentage: calculatePercentage(data.wealth?.realEstate?.total, data.wealth?.netWorth)
      },
      securities: {
        value: data.wealth?.investmentAssets?.securities || 0,
        percentage: calculatePercentage(data.wealth?.investmentAssets?.securities, data.wealth?.netWorth)
      },
      privateEquity: {
        value: data.wealth?.investmentAssets?.privateEquity || 0,
        percentage: calculatePercentage(data.wealth?.investmentAssets?.privateEquity, data.wealth?.netWorth)
      },
      cash: {
        value: data.wealth?.liquidAssets || 0,
        percentage: calculatePercentage(data.wealth?.liquidAssets, data.wealth?.netWorth)
      },
      other: {
        value: calculateOtherAssets(data.wealth),
        percentage: 0 // Will be calculated below
      }
    }
  };
  
  // Calculate percentage for "other" category
  const totalPercentage = Object.values(wealthData.composition)
    .reduce((sum, category) => sum + category.percentage, 0);
  
  wealthData.composition.other.percentage = Math.max(0, 100 - totalPercentage);
  
  return wealthData;
};

/**
 * Calculate percentage of a value relative to a total
 * @param {number} value - The value
 * @param {number} total - The total
 * @returns {number} Percentage value
 */
const calculatePercentage = (value, total) => {
  if (!value || !total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Calculate other assets value
 * @param {Object} wealth - Wealth data object
 * @returns {number} Value of other assets
 */
const calculateOtherAssets = (wealth) => {
  if (!wealth || !wealth.netWorth) return 0;
  
  const knownAssets = (wealth.realEstate?.total || 0) +
    (wealth.investmentAssets?.securities || 0) +
    (wealth.investmentAssets?.privateEquity || 0) +
    (wealth.liquidAssets || 0);
  
  return Math.max(0, wealth.netWorth - knownAssets);
};