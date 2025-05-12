/**
 * Company Model
 * Represents a company registered on the platform
 */

const db = require('../db');

/**
 * Company class for handling company-related database operations
 */
class Company {
  /**
   * Create a new company
   * @param {Object} companyData - Company data
   * @returns {Promise<Object>} - Created company
   */
  static async create(companyData) {
    const {
      name,
      logo = null,
      address = {},
      contactEmail,
      contactPhone,
      website,
      dataAccessPreferences = {},
      subscription = {},
      createdBy
    } = companyData;
    
    // Insert company into database
    const query = `
      INSERT INTO companies (
        name, logo, address, contact_email, contact_phone, website, 
        data_access_preferences, subscription, created_by, active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      name,
      logo,
      JSON.stringify(address),
      contactEmail,
      contactPhone || null,
      website || null,
      JSON.stringify(dataAccessPreferences),
      JSON.stringify(subscription),
      createdBy || null,
      true
    ];
    
    const { rows } = await db.query(query, values);
    return this._formatCompanyData(rows[0]);
  }
  
  /**
   * Find a company by ID
   * @param {string} id - Company ID
   * @returns {Promise<Object|null>} - Company or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT *
      FROM companies
      WHERE id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (!rows.length) {
      return null;
    }
    
    return this._formatCompanyData(rows[0]);
  }
  
  /**
   * Update a company
   * @param {string} id - Company ID
   * @param {Object} companyData - Company data to update
   * @returns {Promise<Object>} - Updated company
   */
  static async update(id, companyData) {
    // Build query dynamically based on provided fields
    let query = 'UPDATE companies SET ';
    const values = [];
    const updateFields = [];
    let paramIndex = 1;
    
    // Map company data fields to database columns
    const fieldMap = {
      name: 'name',
      logo: 'logo',
      address: 'address',
      contactEmail: 'contact_email',
      contactPhone: 'contact_phone',
      website: 'website',
      dataAccessPreferences: 'data_access_preferences',
      subscription: 'subscription',
      active: 'active'
    };
    
    // Add fields to update
    for (const [field, value] of Object.entries(companyData)) {
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
    
    // If no fields to update, return the company
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
    
    return this._formatCompanyData(rows[0]);
  }
  
  /**
   * Delete a company
   * @param {string} id - Company ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    const query = `
      DELETE FROM companies
      WHERE id = $1
    `;
    
    const { rowCount } = await db.query(query, [id]);
    return rowCount > 0;
  }
  
  /**
   * Get all companies with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - List of companies
   */
  static async getAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      name,
      active
    } = options;
    
    let query = `
      SELECT *
      FROM companies
      WHERE 1 = 1
    `;
    
    const values = [];
    let paramIndex = 1;
    
    // Add filters
    if (name) {
      query += ` AND name ILIKE $${paramIndex++}`;
      values.push(`%${name}%`);
    }
    
    if (active !== undefined) {
      query += ` AND active = $${paramIndex++}`;
      values.push(active);
    }
    
    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    values.push(limit, offset);
    
    const { rows } = await db.query(query, values);
    
    // Format company data
    return rows.map(company => this._formatCompanyData(company));
  }
  
  /**
   * Count companies with filtering
   * @param {Object} options - Query options
   * @returns {Promise<number>} - Company count
   */
  static async count(options = {}) {
    const { name, active } = options;
    
    let query = `
      SELECT COUNT(*) as count
      FROM companies
      WHERE 1 = 1
    `;
    
    const values = [];
    let paramIndex = 1;
    
    // Add filters
    if (name) {
      query += ` AND name ILIKE $${paramIndex++}`;
      values.push(`%${name}%`);
    }
    
    if (active !== undefined) {
      query += ` AND active = $${paramIndex++}`;
      values.push(active);
    }
    
    const { rows } = await db.query(query, values);
    return parseInt(rows[0].count);
  }
  
  /**
   * Get user count for a company
   * @param {string} id - Company ID
   * @returns {Promise<number>} - User count
   */
  static async getUserCount(id) {
    const query = `
      SELECT COUNT(*) as count
      FROM users
      WHERE company_id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    return parseInt(rows[0].count);
  }
  
  /**
   * Check if company has access to a specific feature
   * @param {string} id - Company ID
   * @param {string} featureName - Feature name
   * @returns {Promise<boolean>} - Whether company has access
   */
  static async hasFeatureAccess(id, featureName) {
    const company = await this.findById(id);
    
    if (!company) {
      return false;
    }
    
    const featureMap = {
      'basic': ['propertyMap', 'basicSearch', 'basicReports'],
      'professional': ['propertyMap', 'advancedSearch', 'advancedReports', 'wealthAnalysis'],
      'enterprise': ['propertyMap', 'advancedSearch', 'advancedReports', 'wealthAnalysis', 'bulkExport', 'apiAccess']
    };
    
    const plan = company.subscription?.plan || 'basic';
    return featureMap[plan].includes(featureName);
  }
  
  /**
   * Format company data from database row
   * @param {Object} company - Database row
   * @returns {Object} - Formatted company
   * @private
   */
  static _formatCompanyData(company) {
    // Parse JSON fields
    const address = company.address ? 
      (typeof company.address === 'string' ? JSON.parse(company.address) : company.address) : 
      {};
      
    const dataAccessPreferences = company.data_access_preferences ? 
      (typeof company.data_access_preferences === 'string' ? JSON.parse(company.data_access_preferences) : company.data_access_preferences) : 
      {};
      
    const subscription = company.subscription ? 
      (typeof company.subscription === 'string' ? JSON.parse(company.subscription) : company.subscription) : 
      {};
    
    // Convert snake_case to camelCase
    return {
      id: company.id,
      name: company.name,
      logo: company.logo,
      address,
      contactEmail: company.contact_email,
      contactPhone: company.contact_phone,
      website: company.website,
      dataAccessPreferences,
      subscription,
      createdBy: company.created_by,
      active: company.active,
      createdAt: company.created_at,
      updatedAt: company.updated_at
    };
  }
}

module.exports = Company;