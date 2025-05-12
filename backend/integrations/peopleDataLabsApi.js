/**
 * People Data Labs API Integration
 * Provides person and company data enrichment
 */

const axios = require('axios');
const config = require('../config/config');

/**
 * People Data Labs API client
 */
class PeopleDataLabsApi {
  constructor() {
    this.apiKey = config.apiKeys.peopleDataLabs;
    this.baseUrl = 'https://api.peopledatalabs.com/v5';
  }

  /**
   * Enrich person data
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} - Person data
   */
  async enrichPerson(params) {
    try {
      const response = await axios.get(`${this.baseUrl}/person/enrich`, {
        params: {
          ...params,
          api_key: this.apiKey
        }
      });

      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('People Data Labs Person Enrichment Error:', error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Search for people
   * @param {Object} query - Search query
   * @param {number} size - Number of results to return
   * @returns {Promise<Object>} - Search results
   */
  async searchPeople(query, size = 10) {
    try {
      const response = await axios.post(`${this.baseUrl}/person/search`, {
        query,
        size
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey
        }
      });

      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('People Data Labs Person Search Error:', error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Bulk enrich multiple people
   * @param {Array} requests - Array of person requests
   * @returns {Promise<Object>} - Bulk enrichment results
   */
  async bulkEnrichPeople(requests) {
    try {
      const response = await axios.post(`${this.baseUrl}/person/bulk`, {
        requests
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey
        }
      });

      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('People Data Labs Bulk Enrichment Error:', error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Enrich company data
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} - Company data
   */
  async enrichCompany(params) {
    try {
      const response = await axios.get(`${this.baseUrl}/company/enrich`, {
        params: {
          ...params,
          api_key: this.apiKey
        }
      });

      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('People Data Labs Company Enrichment Error:', error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Search for companies
   * @param {Object} query - Search query
   * @param {number} size - Number of results to return
   * @returns {Promise<Object>} - Search results
   */
  async searchCompanies(query, size = 10) {
    try {
      const response = await axios.post(`${this.baseUrl}/company/search`, {
        query,
        size
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey
        }
      });

      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('People Data Labs Company Search Error:', error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }
}

module.exports = new PeopleDataLabsApi();