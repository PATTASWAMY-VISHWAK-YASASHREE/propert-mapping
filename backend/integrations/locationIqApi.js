/**
 * LocationIQ API Integration
 * Provides geocoding, reverse geocoding, and routing services
 */

const axios = require('axios');
const config = require('../config/config');

/**
 * LocationIQ API client
 */
class LocationIqApi {
  constructor() {
    this.apiKey = config.apiKeys.locationIQ;
    this.baseUrl = 'https://us1.locationiq.com/v1';
  }

  /**
   * Geocode an address to get coordinates
   * @param {string} address - The address to geocode
   * @returns {Promise<Object>} - Geocoding results
   */
  async geocode(address) {
    try {
      const response = await axios.get(`${this.baseUrl}/search.php`, {
        params: {
          key: this.apiKey,
          q: address,
          format: 'json',
          limit: 10,
          addressdetails: 1
        }
      });

      return this._formatGeocodingResults(response.data);
    } catch (error) {
      console.error('LocationIQ Geocoding Error:', error.message);
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
      const response = await axios.get(`${this.baseUrl}/reverse.php`, {
        params: {
          key: this.apiKey,
          lat,
          lon: lng,
          format: 'json',
          addressdetails: 1
        }
      });

      return this._formatReverseGeocodingResults(response.data);
    } catch (error) {
      console.error('LocationIQ Reverse Geocoding Error:', error.message);
      throw new Error('Failed to reverse geocode coordinates');
    }
  }

  /**
   * Get routing directions between two points
   * @param {Object} start - Starting coordinates {lat, lng}
   * @param {Object} end - Ending coordinates {lat, lng}
   * @param {string} mode - Transportation mode (car, bicycle, foot)
   * @returns {Promise<Object>} - Routing results
   */
  async getDirections(start, end, mode = 'car') {
    try {
      const response = await axios.get(`${this.baseUrl}/directions/driving/${start.lng},${start.lat};${end.lng},${end.lat}`, {
        params: {
          key: this.apiKey,
          steps: true,
          alternatives: false,
          geometries: 'geojson',
          overview: 'full',
          annotations: 'distance,duration'
        }
      });

      return this._formatDirectionsResults(response.data);
    } catch (error) {
      console.error('LocationIQ Directions Error:', error.message);
      throw new Error('Failed to get directions');
    }
  }

  /**
   * Format geocoding API response
   * @param {Array} data - Raw API response
   * @returns {Object} - Formatted results
   * @private
   */
  _formatGeocodingResults(data) {
    if (!data || data.length === 0) {
      return {
        success: false,
        results: [],
        status: 'ZERO_RESULTS'
      };
    }

    const formattedResults = data.map(result => {
      const { lat, lon, display_name, address, importance, boundingbox } = result;
      
      return {
        formattedAddress: display_name,
        location: {
          lat: parseFloat(lat),
          lng: parseFloat(lon)
        },
        placeId: result.place_id || '',
        components: {
          country: address?.country || '',
          countryCode: address?.country_code?.toUpperCase() || '',
          state: address?.state || '',
          county: address?.county || '',
          city: address?.city || address?.town || address?.village || '',
          zipcode: address?.postcode || '',
          street: address?.road || '',
          streetNumber: address?.house_number || ''
        },
        bounds: boundingbox ? {
          northeast: {
            lat: parseFloat(boundingbox[1]),
            lng: parseFloat(boundingbox[3])
          },
          southwest: {
            lat: parseFloat(boundingbox[0]),
            lng: parseFloat(boundingbox[2])
          }
        } : null,
        confidence: importance || 0,
        types: [address?.type || '']
      };
    });

    return {
      success: true,
      results: formattedResults,
      status: 'OK'
    };
  }

  /**
   * Format reverse geocoding API response
   * @param {Object} data - Raw API response
   * @returns {Object} - Formatted results
   * @private
   */
  _formatReverseGeocodingResults(data) {
    if (!data) {
      return {
        success: false,
        results: [],
        status: 'ZERO_RESULTS'
      };
    }

    const { lat, lon, display_name, address, boundingbox } = data;
    
    const formattedResult = {
      formattedAddress: display_name,
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lon)
      },
      placeId: data.place_id || '',
      components: {
        country: address?.country || '',
        countryCode: address?.country_code?.toUpperCase() || '',
        state: address?.state || '',
        county: address?.county || '',
        city: address?.city || address?.town || address?.village || '',
        zipcode: address?.postcode || '',
        street: address?.road || '',
        streetNumber: address?.house_number || ''
      },
      bounds: boundingbox ? {
        northeast: {
          lat: parseFloat(boundingbox[1]),
          lng: parseFloat(boundingbox[3])
        },
        southwest: {
          lat: parseFloat(boundingbox[0]),
          lng: parseFloat(boundingbox[2])
        }
      } : null,
      types: [address?.type || '']
    };

    return {
      success: true,
      results: [formattedResult],
      status: 'OK'
    };
  }

  /**
   * Format directions API response
   * @param {Object} data - Raw API response
   * @returns {Object} - Formatted results
   * @private
   */
  _formatDirectionsResults(data) {
    if (!data || !data.routes || data.routes.length === 0) {
      return {
        success: false,
        routes: [],
        status: 'ZERO_RESULTS'
      };
    }

    const route = data.routes[0];
    
    return {
      success: true,
      routes: [{
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
        legs: route.legs.map(leg => ({
          distance: leg.distance,
          duration: leg.duration,
          steps: leg.steps.map(step => ({
            distance: step.distance,
            duration: step.duration,
            instructions: step.maneuver?.instruction || '',
            geometry: step.geometry
          }))
        }))
      }],
      status: 'OK'
    };
  }
}

module.exports = new LocationIqApi();