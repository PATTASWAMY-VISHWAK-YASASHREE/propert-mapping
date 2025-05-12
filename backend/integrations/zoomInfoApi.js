/**
 * ZoomInfo API Integration
 * Provides business contact information
 */

const axios = require('axios');
const config = require('../config/api-keys');

// Base URL for ZoomInfo API
const BASE_URL = 'https://api.zoominfo.com/v1';

/**
 * Authenticate with ZoomInfo API
 * @returns {Promise<string>} Access token
 */
const authenticate = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/token`, {
      client_id: config.ZOOMINFO_CLIENT_ID,
      client_secret: config.ZOOMINFO_CLIENT_SECRET,
      grant_type: 'client_credentials'
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error authenticating with ZoomInfo API:', error);
    throw new Error('Failed to authenticate with ZoomInfo API');
  }
};

/**
 * Search companies
 * @param {Object} params - Search parameters
 * @param {string} params.companyName - Company name
 * @param {string} params.industry - Industry
 * @param {string} params.location - Location
 * @param {number} params.revenue - Revenue
 * @param {number} params.employeeCount - Employee count
 * @returns {Promise<Array>} Search results
 */
exports.searchCompanies = async (params) => {
  try {
    const token = await authenticate();
    
    const response = await axios.post(`${BASE_URL}/companies/search`, params, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error searching companies:', error);
    throw new Error('Failed to search companies in ZoomInfo');
  }
};

/**
 * Get company details
 * @param {string} companyId - ZoomInfo company ID
 * @returns {Promise<Object>} Company details
 */
exports.getCompanyDetails = async (companyId) => {
  try {
    const token = await authenticate();
    
    const response = await axios.get(`${BASE_URL}/companies/${companyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching company details:', error);
    throw new Error('Failed to fetch company details from ZoomInfo');
  }
};

/**
 * Search contacts
 * @param {Object} params - Search parameters
 * @param {string} params.name - Contact name
 * @param {string} params.title - Job title
 * @param {string} params.companyName - Company name
 * @param {string} params.location - Location
 * @returns {Promise<Array>} Search results
 */
exports.searchContacts = async (params) => {
  try {
    const token = await authenticate();
    
    const response = await axios.post(`${BASE_URL}/contacts/search`, params, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error searching contacts:', error);
    throw new Error('Failed to search contacts in ZoomInfo');
  }
};

/**
 * Get contact details
 * @param {string} contactId - ZoomInfo contact ID
 * @returns {Promise<Object>} Contact details
 */
exports.getContactDetails = async (contactId) => {
  try {
    const token = await authenticate();
    
    const response = await axios.get(`${BASE_URL}/contacts/${contactId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching contact details:', error);
    throw new Error('Failed to fetch contact details from ZoomInfo');
  }
};

/**
 * Get company contacts
 * @param {string} companyId - ZoomInfo company ID
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of results to return
 * @param {number} params.offset - Offset for pagination
 * @returns {Promise<Array>} Company contacts
 */
exports.getCompanyContacts = async (companyId, params = {}) => {
  try {
    const token = await authenticate();
    
    const response = await axios.get(`${BASE_URL}/companies/${companyId}/contacts`, {
      params,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching company contacts:', error);
    throw new Error('Failed to fetch company contacts from ZoomInfo');
  }
};

/**
 * Enrich contact data
 * @param {Object} contactData - Contact data to enrich
 * @param {string} contactData.email - Email address
 * @param {string} contactData.firstName - First name
 * @param {string} contactData.lastName - Last name
 * @param {string} contactData.companyName - Company name
 * @returns {Promise<Object>} Enriched contact data
 */
exports.enrichContact = async (contactData) => {
  try {
    const token = await authenticate();
    
    const response = await axios.post(`${BASE_URL}/contacts/enrich`, contactData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error enriching contact data:', error);
    throw new Error('Failed to enrich contact data with ZoomInfo');
  }
};

/**
 * Enrich company data
 * @param {Object} companyData - Company data to enrich
 * @param {string} companyData.name - Company name
 * @param {string} companyData.domain - Company domain
 * @param {string} companyData.location - Company location
 * @returns {Promise<Object>} Enriched company data
 */
exports.enrichCompany = async (companyData) => {
  try {
    const token = await authenticate();
    
    const response = await axios.post(`${BASE_URL}/companies/enrich`, companyData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error enriching company data:', error);
    throw new Error('Failed to enrich company data with ZoomInfo');
  }
};