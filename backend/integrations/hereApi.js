/**
 * Here.com API Integration
 * Provides mapping and location services
 */

const axios = require('axios');
const config = require('../config/api-keys');

// Base URL for Here API
const BASE_URL = 'https://api.here.com/v3';

/**
 * Get map tiles for a specific location
 * @param {Object} options - Map options
 * @param {number} options.zoom - Zoom level
 * @param {number} options.lat - Latitude
 * @param {number} options.lng - Longitude
 * @param {string} options.mapType - Map type (satellite, terrain, etc.)
 * @returns {Promise<Object>} Map tile data
 */
exports.getMapTiles = async (options) => {
  try {
    const { zoom, lat, lng, mapType = 'normal.day' } = options;
    
    const response = await axios.get(`${BASE_URL}/maptile/2.1/maptile/newest/${mapType}/${zoom}/${lat}/${lng}/256/png8`, {
      params: {
        apiKey: config.HERE_API_KEY
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching map tiles:', error);
    throw new Error('Failed to fetch map tiles from Here API');
  }
};

/**
 * Geocode an address to get coordinates
 * @param {string} address - Address to geocode
 * @returns {Promise<Object>} Geocoded location
 */
exports.geocodeAddress = async (address) => {
  try {
    const response = await axios.get(`${BASE_URL}/geocode/search`, {
      params: {
        q: address,
        apiKey: config.HERE_API_KEY,
        limit: 1
      }
    });
    
    if (!response.data.items || response.data.items.length === 0) {
      return null;
    }
    
    const location = response.data.items[0];
    
    return {
      address: location.address,
      position: location.position,
      boundingBox: location.mapView
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw new Error('Failed to geocode address using Here API');
  }
};

/**
 * Get address suggestions for autocomplete
 * @param {string} query - Partial address query
 * @returns {Promise<Array>} Address suggestions
 */
exports.getAddressSuggestions = async (query) => {
  try {
    const response = await axios.get(`${BASE_URL}/geocode/autocomplete`, {
      params: {
        q: query,
        apiKey: config.HERE_API_KEY,
        limit: 10
      }
    });
    
    if (!response.data.items) {
      return [];
    }
    
    return response.data.items.map(item => ({
      title: item.title,
      address: item.address,
      position: item.position
    }));
  } catch (error) {
    console.error('Error getting address suggestions:', error);
    throw new Error('Failed to get address suggestions from Here API');
  }
};

/**
 * Get route between two points
 * @param {Object} options - Route options
 * @param {Object} options.start - Start coordinates {lat, lng}
 * @param {Object} options.end - End coordinates {lat, lng}
 * @param {string} options.transportMode - Mode of transport (car, pedestrian, etc.)
 * @returns {Promise<Object>} Route data
 */
exports.getRoute = async (options) => {
  try {
    const { start, end, transportMode = 'car' } = options;
    
    const response = await axios.get(`${BASE_URL}/routing/v8/routes`, {
      params: {
        apiKey: config.HERE_API_KEY,
        origin: `${start.lat},${start.lng}`,
        destination: `${end.lat},${end.lng}`,
        transportMode,
        return: 'polyline,summary,actions,instructions'
      }
    });
    
    if (!response.data.routes || response.data.routes.length === 0) {
      return null;
    }
    
    return response.data.routes[0];
  } catch (error) {
    console.error('Error getting route:', error);
    throw new Error('Failed to get route from Here API');
  }
};

/**
 * Get places near a location
 * @param {Object} options - Search options
 * @param {number} options.lat - Latitude
 * @param {number} options.lng - Longitude
 * @param {number} options.radius - Search radius in meters
 * @param {string} options.category - Place category
 * @returns {Promise<Array>} Places near location
 */
exports.getNearbyPlaces = async (options) => {
  try {
    const { lat, lng, radius = 1000, category } = options;
    
    const params = {
      apiKey: config.HERE_API_KEY,
      at: `${lat},${lng}`,
      limit: 20
    };
    
    if (radius) {
      params.radius = radius;
    }
    
    if (category) {
      params.categories = category;
    }
    
    const response = await axios.get(`${BASE_URL}/places/v1/browse`, { params });
    
    if (!response.data.results || !response.data.results.items) {
      return [];
    }
    
    return response.data.results.items;
  } catch (error) {
    console.error('Error getting nearby places:', error);
    throw new Error('Failed to get nearby places from Here API');
  }
};

/**
 * Get isoline (reachable area) from a point
 * @param {Object} options - Isoline options
 * @param {number} options.lat - Latitude
 * @param {number} options.lng - Longitude
 * @param {number} options.range - Range in seconds (for time) or meters (for distance)
 * @param {string} options.rangeType - Type of range ('time' or 'distance')
 * @param {string} options.transportMode - Mode of transport
 * @returns {Promise<Object>} Isoline polygon
 */
exports.getIsoline = async (options) => {
  try {
    const { 
      lat, 
      lng, 
      range = 1000, 
      rangeType = 'distance', 
      transportMode = 'car' 
    } = options;
    
    const response = await axios.get(`${BASE_URL}/routing/v8/isoline`, {
      params: {
        apiKey: config.HERE_API_KEY,
        origin: `${lat},${lng}`,
        range: [range],
        rangeType,
        transportMode
      }
    });
    
    if (!response.data.isolines || response.data.isolines.length === 0) {
      return null;
    }
    
    return response.data.isolines[0];
  } catch (error) {
    console.error('Error getting isoline:', error);
    throw new Error('Failed to get isoline from Here API');
  }
};