/**
 * Saved Map View model
 */

const db = require('../db');

/**
 * SavedMapView class for handling saved map view database operations
 */
class SavedMapView {
  /**
   * Create a new saved map view
   * @param {Object} mapViewData - Map view data
   * @returns {Promise<Object>} - Created map view
   */
  static async create(mapViewData) {
    const {
      userId,
      name,
      center,
      zoom,
      bounds,
      filters
    } = mapViewData;
    
    // Insert map view into database
    const query = `
      INSERT INTO saved_map_views (
        user_id, name, center_lat, center_lng, zoom,
        bounds_ne_lat, bounds_ne_lng, bounds_sw_lat, bounds_sw_lng, filters
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      userId,
      name,
      center.lat,
      center.lng,
      zoom,
      bounds?.northeast?.lat || null,
      bounds?.northeast?.lng || null,
      bounds?.southwest?.lat || null,
      bounds?.southwest?.lng || null,
      filters ? JSON.stringify(filters) : null
    ];
    
    const { rows } = await db.query(query, values);
    return this._formatMapViewData(rows[0]);
  }
  
  /**
   * Find a saved map view by ID
   * @param {string} id - Map view ID
   * @returns {Promise<Object|null>} - Map view or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT *
      FROM saved_map_views
      WHERE id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (!rows.length) {
      return null;
    }
    
    return this._formatMapViewData(rows[0]);
  }
  
  /**
   * Get all saved map views for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - List of saved map views
   */
  static async findByUserId(userId) {
    const query = `
      SELECT *
      FROM saved_map_views
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const { rows } = await db.query(query, [userId]);
    return rows.map(mapView => this._formatMapViewData(mapView));
  }
  
  /**
   * Delete a saved map view
   * @param {string} id - Map view ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id, userId) {
    const query = `
      DELETE FROM saved_map_views
      WHERE id = $1 AND user_id = $2
    `;
    
    const { rowCount } = await db.query(query, [id, userId]);
    return rowCount > 0;
  }
  
  /**
   * Format map view data from database row
   * @param {Object} mapView - Database row
   * @returns {Object} - Formatted map view
   * @private
   */
  static _formatMapViewData(mapView) {
    return {
      id: mapView.id,
      userId: mapView.user_id,
      name: mapView.name,
      center: {
        lat: parseFloat(mapView.center_lat),
        lng: parseFloat(mapView.center_lng)
      },
      zoom: mapView.zoom,
      bounds: mapView.bounds_ne_lat ? {
        northeast: {
          lat: parseFloat(mapView.bounds_ne_lat),
          lng: parseFloat(mapView.bounds_ne_lng)
        },
        southwest: {
          lat: parseFloat(mapView.bounds_sw_lat),
          lng: parseFloat(mapView.bounds_sw_lng)
        }
      } : null,
      filters: mapView.filters ? JSON.parse(mapView.filters) : null,
      createdAt: mapView.created_at
    };
  }
}

module.exports = SavedMapView;