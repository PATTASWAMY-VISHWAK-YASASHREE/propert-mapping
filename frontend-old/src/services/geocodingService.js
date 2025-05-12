/**
 * Geocoding Service
 * Handles communication with the backend for geocoding operations
 */

import axios from 'axios';
import { API_URL } from '../config';

/**
 * Geocoding service for address and coordinate lookups
 */
class GeocodingService {
  /**
   * Geocode an address to get coordinates
   * @param {string} address - The address to geocode
   * @returns {Promise<Object>} - Geocoding results
   */
  async geocodeAddress(address) {
    try {
      const response = await axios.post(`${API_URL}/api/map/geocode`, { address });
      return response.data;
    } catch (error) {
      console.error('Geocoding Error:', error.response?.data?.error || error.message);
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
      const response = await axios.get(`${API_URL}/api/map/reverse-geocode`, {
        params: { lat, lng }
      });
      return response.data;
    } catch (error) {
      console.error('Reverse Geocoding Error:', error.response?.data?.error || error.message);
      throw new Error('Failed to reverse geocode coordinates');
    }
  }

  /**
   * Get address suggestions as user types
   * @param {string} query - Partial address query
   * @returns {Promise<Array>} - List of address suggestions
   */
  async getAddressSuggestions(query) {
    try {
      const response = await axios.get(`${API_URL}/api/map/suggestions`, {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Address Suggestions Error:', error.response?.data?.error || error.message);
      throw new Error('Failed to get address suggestions');
    }
  }
}

export default new GeocodingService();