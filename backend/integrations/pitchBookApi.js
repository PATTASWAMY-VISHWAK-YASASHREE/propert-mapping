/**
 * PitchBook API Integration
 * Provides company and investor data
 */

const axios = require('axios');
const config = require('../config/api-keys');

// Base URL for PitchBook API
const BASE_URL = 'https://api.pitchbook.com/v1';

/**
 * Get company details
 * @param {string} companyId - PitchBook company ID
 * @returns {Promise<Object>} Company details
 */
exports.getCompanyDetails = async (companyId) => {
  try {
    const response = await axios.get(`${BASE_URL}/companies/${companyId}`, {
      headers: {
        'Authorization': `Bearer ${config.PITCHBOOK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching company details:', error);
    throw new Error('Failed to fetch company details from PitchBook');
  }
};

/**
 * Search companies
 * @param {Object} params - Search parameters
 * @param {string} params.name - Company name
 * @param {string} params.location - Company location
 * @param {string} params.industry - Company industry
 * @returns {Promise<Array>} Search results
 */
exports.searchCompanies = async (params) => {
  try {
    const response = await axios.get(`${BASE_URL}/companies/search`, {
      params,
      headers: {
        'Authorization': `Bearer ${config.PITCHBOOK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error('Error searching companies:', error);
    throw new Error('Failed to search companies in PitchBook');
  }
};

/**
 * Get investor details
 * @param {string} investorId - PitchBook investor ID
 * @returns {Promise<Object>} Investor details
 */
exports.getInvestorDetails = async (investorId) => {
  try {
    const response = await axios.get(`${BASE_URL}/investors/${investorId}`, {
      headers: {
        'Authorization': `Bearer ${config.PITCHBOOK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching investor details:', error);
    throw new Error('Failed to fetch investor details from PitchBook');
  }
};

/**
 * Search investors
 * @param {Object} params - Search parameters
 * @param {string} params.name - Investor name
 * @param {string} params.type - Investor type
 * @param {string} params.location - Investor location
 * @returns {Promise<Array>} Search results
 */
exports.searchInvestors = async (params) => {
  try {
    const response = await axios.get(`${BASE_URL}/investors/search`, {
      params,
      headers: {
        'Authorization': `Bearer ${config.PITCHBOOK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error('Error searching investors:', error);
    throw new Error('Failed to search investors in PitchBook');
  }
};

/**
 * Get company financials
 * @param {string} companyId - PitchBook company ID
 * @returns {Promise<Object>} Company financials
 */
exports.getCompanyFinancials = async (companyId) => {
  try {
    const response = await axios.get(`${BASE_URL}/companies/${companyId}/financials`, {
      headers: {
        'Authorization': `Bearer ${config.PITCHBOOK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching company financials:', error);
    throw new Error('Failed to fetch company financials from PitchBook');
  }
};

/**
 * Get company funding rounds
 * @param {string} companyId - PitchBook company ID
 * @returns {Promise<Array>} Funding rounds
 */
exports.getCompanyFundingRounds = async (companyId) => {
  try {
    const response = await axios.get(`${BASE_URL}/companies/${companyId}/funding-rounds`, {
      headers: {
        'Authorization': `Bearer ${config.PITCHBOOK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.rounds;
  } catch (error) {
    console.error('Error fetching company funding rounds:', error);
    throw new Error('Failed to fetch company funding rounds from PitchBook');
  }
};

/**
 * Get company executives
 * @param {string} companyId - PitchBook company ID
 * @returns {Promise<Array>} Company executives
 */
exports.getCompanyExecutives = async (companyId) => {
  try {
    const response = await axios.get(`${BASE_URL}/companies/${companyId}/executives`, {
      headers: {
        'Authorization': `Bearer ${config.PITCHBOOK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.executives;
  } catch (error) {
    console.error('Error fetching company executives:', error);
    throw new Error('Failed to fetch company executives from PitchBook');
  }
};

/**
 * Get investor portfolio
 * @param {string} investorId - PitchBook investor ID
 * @returns {Promise<Array>} Investor portfolio
 */
exports.getInvestorPortfolio = async (investorId) => {
  try {
    const response = await axios.get(`${BASE_URL}/investors/${investorId}/portfolio`, {
      headers: {
        'Authorization': `Bearer ${config.PITCHBOOK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.investments;
  } catch (error) {
    console.error('Error fetching investor portfolio:', error);
    throw new Error('Failed to fetch investor portfolio from PitchBook');
  }
};