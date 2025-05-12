/**
 * Map Service
 * Handles map-related operations and geocoding
 */

const opencageApi = require('../integrations/opencageApi');
const SavedMapView = require('../models/SavedMapView');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Map Service class for handling map operations
 */
class MapService {
  /**
   * Geocode an address to get coordinates
   * @param {string} address - The address to geocode
   * @returns {Promise<Object>} - Geocoding results
   */
  async geocodeAddress(address) {
    try {
      const result = await opencageApi.geocode(address);
      return result;
    } catch (error) {
      throw new ErrorResponse(`Geocoding failed: ${error.message}`, 500);
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
      const result = await opencageApi.reverseGeocode(lat, lng);
      return result;
    } catch (error) {
      throw new ErrorResponse(`Reverse geocoding failed: ${error.message}`, 500);
    }
  }

  /**
   * Save a map view for a user
   * @param {Object} mapView - Map view data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Saved map view
   */
  async saveMapView(mapView, userId) {
    try {
      const { name, center, zoom, bounds, filters } = mapView;
      
      const savedMapView = await SavedMapView.create({
        name,
        center,
        zoom,
        bounds,
        filters,
        user: userId
      });

      return savedMapView;
    } catch (error) {
      throw new ErrorResponse(`Failed to save map view: ${error.message}`, 500);
    }
  }

  /**
   * Get all saved map views for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - List of saved map views
   */
  async getSavedMapViews(userId) {
    try {
      const mapViews = await SavedMapView.find({ user: userId });
      return mapViews;
    } catch (error) {
      throw new ErrorResponse(`Failed to get saved map views: ${error.message}`, 500);
    }
  }

  /**
   * Delete a saved map view
   * @param {string} mapViewId - Map view ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteSavedMapView(mapViewId, userId) {
    try {
      const mapView = await SavedMapView.findById(mapViewId);
      
      if (!mapView) {
        throw new ErrorResponse('Map view not found', 404);
      }
      
      // Check if user owns the map view
      if (mapView.user.toString() !== userId) {
        throw new ErrorResponse('Not authorized to delete this map view', 401);
      }
      
      await mapView.remove();
    } catch (error) {
      throw new ErrorResponse(`Failed to delete map view: ${error.message}`, 500);
    }
  }
}

module.exports = new MapService();