/**
 * SavedSearch Model
 * Represents a saved search with specific filters
 */

const db = require('../db');

/**
 * SavedSearch class for handling saved search-related database operations
 */
class SavedSearch {
  /**
   * Create a new saved search
   * @param {Object} searchData - Saved search data
   * @returns {Promise<Object>} - Created saved search
   */
  static async create(searchData) {
    const {
      userId,
      companyId,
      name,
      filters
    } = searchData;
    
    // Insert saved search into database
    const query = `
      INSERT INTO saved_searches (
        user_id, company_id, name, filters
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [
      userId,
      companyId,
      name,
      JSON.stringify(filters)
    ];
    
    const { rows } = await db.query(query, values);
    return this._formatSavedSearchData(rows[0]);
  }
  
  /**
   * Find a saved search by ID
   * @param {string} id - Saved search ID
   * @returns {Promise<Object|null>} - Saved search or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT ss.*, u.first_name || ' ' || u.last_name as user_name, c.name as company_name
      FROM saved_searches ss
      LEFT JOIN users u ON ss.user_id = u.id
      LEFT JOIN companies c ON ss.company_id = c.id
      WHERE ss.id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (!rows.length) {
      return null;
    }
    
    return this._formatSavedSearchData(rows[0]);
  }
  
  /**
   * Update a saved search
   * @param {string} id - Saved search ID
   * @param {Object} searchData - Saved search data to update
   * @returns {Promise<Object>} - Updated saved search
   */
  static async update(id, searchData) {
    // Build query dynamically based on provided fields
    let query = 'UPDATE saved_searches SET ';
    const values = [];
    const updateFields = [];
    let paramIndex = 1;
    
    // Map saved search data fields to database columns
    const fieldMap = {
      name: 'name',
      filters: 'filters',
      lastUsed: 'last_used'
    };
    
    // Add fields to update
    for (const [field, value] of Object.entries(searchData)) {
      if (value !== undefined && fieldMap[field]) {
        let dbValue = value;
        
        // Convert objects to JSON strings
        if (typeof value === 'object' && value !== null) {
          dbValue = JSON.stringify(value);
        }
        
        updateFields.push(`${fieldMap[field]} = $${paramIndex++}`);
        values.push(dbValue);
      }
    }
    
    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`);
    
    // If no fields to update, return the saved search
    if (updateFields.length === 1) { // Only updated_at
      return this.findById(id);
    }
    
    query += updateFields.join(', ');
    query += ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);
    
    const { rows } = await db.query(query, values);
    
    if (!rows.length) {
      return null;
    }
    
    return this._formatSavedSearchData(rows[0]);
  }
  
  /**
   * Delete a saved search
   * @param {string} id - Saved search ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    const query = `
      DELETE FROM saved_searches
      WHERE id = $1
    `;
    
    const { rowCount } = await db.query(query, [id]);
    return rowCount > 0;
  }
  
  /**
   * Get all saved searches with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - List of saved searches
   */
  static async getAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      userId,
      companyId
    } = options;
    
    let query = `
      SELECT ss.*, u.first_name || ' ' || u.last_name as user_name, c.name as company_name
      FROM saved_searches ss
      LEFT JOIN users u ON ss.user_id = u.id
      LEFT JOIN companies c ON ss.company_id = c.id
      WHERE 1 = 1
    `;
    
    const values = [];
    let paramIndex = 1;
    
    // Add filters
    if (userId) {
      query += ` AND ss.user_id = $${paramIndex++}`;
      values.push(userId);
    }
    
    if (companyId) {
      query += ` AND ss.company_id = $${paramIndex++}`;
      values.push(companyId);
    }
    
    // Add pagination
    query += ` ORDER BY ss.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    values.push(limit, offset);
    
    const { rows } = await db.query(query, values);
    
    // Format saved search data
    return rows.map(search => this._formatSavedSearchData(search));
  }
  
  /**
   * Count saved searches with filtering
   * @param {Object} options - Query options
   * @returns {Promise<number>} - Saved search count
   */
  static async count(options = {}) {
    const { userId, companyId } = options;
    
    let query = `
      SELECT COUNT(*) as count
      FROM saved_searches
      WHERE 1 = 1
    `;
    
    const values = [];
    let paramIndex = 1;
    
    // Add filters
    if (userId) {
      query += ` AND user_id = $${paramIndex++}`;
      values.push(userId);
    }
    
    if (companyId) {
      query += ` AND company_id = $${paramIndex++}`;
      values.push(companyId);
    }
    
    const { rows } = await db.query(query, values);
    return parseInt(rows[0].count);
  }
  
  /**
   * Update last used timestamp
   * @param {string} id - Saved search ID
   * @returns {Promise<Object>} - Updated saved search
   */
  static async updateLastUsed(id) {
    const query = `
      UPDATE saved_searches
      SET last_used = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (!rows.length) {
      return null;
    }
    
    return this._formatSavedSearchData(rows[0]);
  }
  
  /**
   * Format saved search data from database row
   * @param {Object} search - Database row
   * @returns {Object} - Formatted saved search
   * @private
   */
  static _formatSavedSearchData(search) {
    // Parse JSON fields
    const filters = search.filters ? 
      (typeof search.filters === 'string' ? JSON.parse(search.filters) : search.filters) : 
      {};
    
    // Convert snake_case to camelCase
    const formattedSearch = {
      id: search.id,
      userId: search.user_id,
      companyId: search.company_id,
      name: search.name,
      filters,
      lastUsed: search.last_used,
      createdAt: search.created_at,
      updatedAt: search.updated_at
    };
    
    // Add user and company names if available
    if (search.user_name) {
      formattedSearch.userName = search.user_name;
    }
    
    if (search.company_name) {
      formattedSearch.companyName = search.company_name;
    }
    
    return formattedSearch;
  }
}

module.exports = SavedSearch;