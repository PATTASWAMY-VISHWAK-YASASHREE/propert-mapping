const axios = require('axios');

const REGRID_API_KEY = process.env.REGRID_API_KEY;
const BASE_URL = 'https://api.regrid.com/v1'; // Replace with the actual Regrid API base URL

/**
 * Fetch map tiles from Regrid
 * @param {Object} options - Map options
 * @param {number} options.zoom - Zoom level
 * @param {number} options.lat - Latitude
 * @param {number} options.lng - Longitude
 * @returns {Promise<Object>} - Map tile data
 */
exports.getMapTiles = async (options) => {
  try {
    const { zoom, lat, lng } = options;

    const response = await axios.get(`${BASE_URL}/map/tiles`, {
      params: { zoom, lat, lng },
      headers: {
        Authorization: `Bearer ${REGRID_API_KEY}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching Regrid map tiles:', error.message);
    throw new Error('Failed to fetch Regrid map tiles');
  }
};