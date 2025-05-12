/**
 * OpenCage Geocoding API Integration
 */

const axios = require('axios');
const config = require('../config/config');

/**
 * OpenCage API client for geocoding and reverse geocoding
 */
class OpenCageApi {
  constructor() {
    this.apiKey = config.apiKeys.opencage;
    this.baseUrl = 'https://api.opencagedata.com/geocode/v1/json';
  }

  /**
   * Geocode an address to get coordinates
   * @param {string} address - The address to geocode
   * @returns {Promise<Object>} - Geocoding results
   */
  async geocode(address) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          q: address,
          key: this.apiKey,
          limit: 10,
          no_annotations: 0
        }
      });

      return this._formatResults(response.data);
    } catch (error) {
      console.error('OpenCage Geocoding Error:', error.message);
      throw new Error('Failed to geocode address');
    }
  }

  /**
   * Reverse geocode coordinates to get address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} - Reverse geocoding results
   */
  async reverseGeocode(lat, lng) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          q: `${lat},${lng}`,
          key: this.apiKey,
          limit: 1,
          no_annotations: 0
        }
      });

      return this._formatResults(response.data);
    } catch (error) {
      console.error('OpenCage Reverse Geocoding Error:', error.message);
      throw new Error('Failed to reverse geocode coordinates');
    }
  }

  /**
   * Format API response into a standardized format
   * @param {Object} data - Raw API response
   * @returns {Object} - Formatted results
   * @private
   */
  _formatResults(data) {
    if (!data.results || data.results.length === 0) {
      return {
        success: false,
        results: [],
        status: data.status || 'ZERO_RESULTS'
      };
    }

    const formattedResults = data.results.map(result => {
      const { lat, lng } = result.geometry;
      
      return {
        formattedAddress: result.formatted,
        location: {
          lat,
          lng
        },
        placeId: result.annotations?.mgrs || '',
        components: {
          country: result.components?.country || '',
          countryCode: result.components?.country_code?.toUpperCase() || '',
          state: result.components?.state || '',
          county: result.components?.county || '',
          city: result.components?.city || result.components?.town || result.components?.village || '',
          zipcode: result.components?.postcode || '',
          street: result.components?.road || '',
          streetNumber: result.components?.house_number || ''
        },
        bounds: result.bounds ? {
          northeast: {
            lat: result.bounds.northeast.lat,
            lng: result.bounds.northeast.lng
          },
          southwest: {
            lat: result.bounds.southwest.lat,
            lng: result.bounds.southwest.lng
          }
        } : null,
        confidence: result.confidence || 0,
        types: []
      };
    });

    return {
      success: true,
      results: formattedResults,
      status: 'OK'
    };
  }
}

module.exports = new OpenCageApi();