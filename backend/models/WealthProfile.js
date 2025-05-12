/**
 * WealthProfile Model
 * Represents wealth data for property owners
 */

const db = require('../db');

/**
 * WealthProfile class for handling wealth profile-related database operations
 */
class WealthProfile {
  /**
   * Create a new wealth profile
   * @param {Object} profileData - Wealth profile data
   * @returns {Promise<Object>} - Created wealth profile
   */
  static async create(profileData) {
    const {
      ownerId,
      estimatedNetWorth,
      wealthComposition = {},
      income = {},
      philanthropicActivity = {},
      dataSources = [],
      wealthIndicators = {},
      metadata = {}
    } = profileData;
    
    // Insert wealth profile into database
    const query = `
      INSERT INTO wealth_profiles (
        owner_id, estimated_net_worth, wealth_composition, income,
        philanthropic_activity, data_sources, wealth_indicators, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      ownerId,
      JSON.stringify(estimatedNetWorth),
      JSON.stringify(wealthComposition),
      JSON.stringify(income),
      JSON.stringify(philanthropicActivity),
      JSON.stringify(dataSources),
      JSON.stringify(wealthIndicators),
      JSON.stringify(metadata)
    ];
    
    const { rows } = await db.query(query, values);
    return this._formatWealthProfileData(rows[0]);
  }
  
  /**
   * Find a wealth profile by ID
   * @param {string} id - Wealth profile ID
   * @returns {Promise<Object|null>} - Wealth profile or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT *
      FROM wealth_profiles
      WHERE id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (!rows.length) {
      return null;
    }
    
    return this._formatWealthProfileData(rows[0]);
  }
  
  /**
   * Find a wealth profile by owner ID
   * @param {string} ownerId - Owner ID
   * @returns {Promise<Object|null>} - Wealth profile or null if not found
   */
  static async findByOwnerId(ownerId) {
    const query = `
      SELECT *
      FROM wealth_profiles
      WHERE owner_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const { rows } = await db.query(query, [ownerId]);
    
    if (!rows.length) {
      return null;
    }
    
    return this._formatWealthProfileData(rows[0]);
  }
  
  /**
   * Update a wealth profile
   * @param {string} id - Wealth profile ID
   * @param {Object} profileData - Wealth profile data to update
   * @returns {Promise<Object>} - Updated wealth profile
   */
  static async update(id, profileData) {
    // Build query dynamically based on provided fields
    let query = 'UPDATE wealth_profiles SET ';
    const values = [];
    const updateFields = [];
    let paramIndex = 1;
    
    // Map profile data fields to database columns
    const fieldMap = {
      estimatedNetWorth: 'estimated_net_worth',
      wealthComposition: 'wealth_composition',
      income: 'income',
      philanthropicActivity: 'philanthropic_activity',
      dataSources: 'data_sources',
      wealthIndicators: 'wealth_indicators',
      metadata: 'metadata'
    };
    
    // Add fields to update
    for (const [field, value] of Object.entries(profileData)) {
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
    
    // If no fields to update, return the profile
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
    
    return this._formatWealthProfileData(rows[0]);
  }
  
  /**
   * Delete a wealth profile
   * @param {string} id - Wealth profile ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    const query = `
      DELETE FROM wealth_profiles
      WHERE id = $1
    `;
    
    const { rowCount } = await db.query(query, [id]);
    return rowCount > 0;
  }
  
  /**
   * Get all wealth profiles with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - List of wealth profiles
   */
  static async getAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      minNetWorth,
      maxNetWorth,
      ownerId
    } = options;
    
    let query = `
      SELECT wp.*, o.type as owner_type, 
        CASE 
          WHEN o.type = 'individual' THEN o.individual->>'firstName' || ' ' || o.individual->>'lastName'
          ELSE o.entity->>'name'
        END as owner_name
      FROM wealth_profiles wp
      JOIN owners o ON wp.owner_id = o.id
      WHERE 1 = 1
    `;
    
    const values = [];
    let paramIndex = 1;
    
    // Add filters
    if (ownerId) {
      query += ` AND wp.owner_id = $${paramIndex++}`;
      values.push(ownerId);
    }
    
    if (minNetWorth !== undefined) {
      query += ` AND (wp.estimated_net_worth->>'value')::numeric >= $${paramIndex++}`;
      values.push(minNetWorth);
    }
    
    if (maxNetWorth !== undefined) {
      query += ` AND (wp.estimated_net_worth->>'value')::numeric <= $${paramIndex++}`;
      values.push(maxNetWorth);
    }
    
    // Add pagination
    query += ` ORDER BY wp.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    values.push(limit, offset);
    
    const { rows } = await db.query(query, values);
    
    // Format wealth profile data
    return rows.map(profile => {
      const formattedProfile = this._formatWealthProfileData(profile);
      formattedProfile.ownerType = profile.owner_type;
      formattedProfile.ownerName = profile.owner_name;
      return formattedProfile;
    });
  }
  
  /**
   * Count wealth profiles with filtering
   * @param {Object} options - Query options
   * @returns {Promise<number>} - Wealth profile count
   */
  static async count(options = {}) {
    const { minNetWorth, maxNetWorth, ownerId } = options;
    
    let query = `
      SELECT COUNT(*) as count
      FROM wealth_profiles wp
      WHERE 1 = 1
    `;
    
    const values = [];
    let paramIndex = 1;
    
    // Add filters
    if (ownerId) {
      query += ` AND wp.owner_id = $${paramIndex++}`;
      values.push(ownerId);
    }
    
    if (minNetWorth !== undefined) {
      query += ` AND (wp.estimated_net_worth->>'value')::numeric >= $${paramIndex++}`;
      values.push(minNetWorth);
    }
    
    if (maxNetWorth !== undefined) {
      query += ` AND (wp.estimated_net_worth->>'value')::numeric <= $${paramIndex++}`;
      values.push(maxNetWorth);
    }
    
    const { rows } = await db.query(query, values);
    return parseInt(rows[0].count);
  }
  
  /**
   * Get wealth tier category
   * @param {Object} profile - Wealth profile object
   * @returns {string} - Wealth tier category
   */
  static getWealthTier(profile) {
    const netWorth = profile.estimatedNetWorth?.value || 0;
    
    if (netWorth >= 1000000000) return 'Ultra High Net Worth (Billionaire)';
    if (netWorth >= 100000000) return 'Ultra High Net Worth';
    if (netWorth >= 30000000) return 'Very High Net Worth';
    if (netWorth >= 5000000) return 'High Net Worth';
    if (netWorth >= 1000000) return 'Affluent';
    if (netWorth >= 500000) return 'Mass Affluent';
    return 'Mass Market';
  }
  
  /**
   * Get formatted net worth with appropriate suffix
   * @param {Object} profile - Wealth profile object
   * @returns {string} - Formatted net worth
   */
  static getFormattedNetWorth(profile) {
    const netWorth = profile.estimatedNetWorth?.value || 0;
    
    if (netWorth >= 1000000000) {
      return `$${(netWorth / 1000000000).toFixed(1)}B`;
    }
    if (netWorth >= 1000000) {
      return `$${(netWorth / 1000000).toFixed(1)}M`;
    }
    if (netWorth >= 1000) {
      return `$${(netWorth / 1000).toFixed(1)}K`;
    }
    
    return `$${netWorth.toFixed(0)}`;
  }
  
  /**
   * Get confidence level description
   * @param {Object} profile - Wealth profile object
   * @returns {string} - Confidence level description
   */
  static getConfidenceDescription(profile) {
    const score = profile.metadata?.overallConfidenceScore || 0;
    
    if (score >= 90) return 'Very High';
    if (score >= 70) return 'High';
    if (score >= 50) return 'Medium';
    if (score >= 30) return 'Low';
    return 'Very Low';
  }
  
  /**
   * Get primary wealth source
   * @param {Object} profile - Wealth profile object
   * @returns {string} - Primary wealth source
   */
  static getPrimaryWealthSource(profile) {
    const composition = profile.wealthComposition || {};
    const sources = [
      { name: 'Real Estate', value: composition.realEstate?.value || 0 },
      { name: 'Securities', value: composition.securities?.value || 0 },
      { name: 'Private Equity', value: composition.privateEquity?.value || 0 },
      { name: 'Cash', value: composition.cash?.value || 0 },
      { name: 'Other', value: composition.other?.value || 0 }
    ];
    
    // Sort by value descending
    sources.sort((a, b) => b.value - a.value);
    
    return sources[0].name;
  }
  
  /**
   * Format wealth profile data from database row
   * @param {Object} profile - Database row
   * @returns {Object} - Formatted wealth profile
   * @private
   */
  static _formatWealthProfileData(profile) {
    // Parse JSON fields
    const estimatedNetWorth = profile.estimated_net_worth ? 
      (typeof profile.estimated_net_worth === 'string' ? JSON.parse(profile.estimated_net_worth) : profile.estimated_net_worth) : 
      {};
      
    const wealthComposition = profile.wealth_composition ? 
      (typeof profile.wealth_composition === 'string' ? JSON.parse(profile.wealth_composition) : profile.wealth_composition) : 
      {};
      
    const income = profile.income ? 
      (typeof profile.income === 'string' ? JSON.parse(profile.income) : profile.income) : 
      {};
      
    const philanthropicActivity = profile.philanthropic_activity ? 
      (typeof profile.philanthropic_activity === 'string' ? JSON.parse(profile.philanthropic_activity) : profile.philanthropic_activity) : 
      {};
      
    const dataSources = profile.data_sources ? 
      (typeof profile.data_sources === 'string' ? JSON.parse(profile.data_sources) : profile.data_sources) : 
      [];
      
    const wealthIndicators = profile.wealth_indicators ? 
      (typeof profile.wealth_indicators === 'string' ? JSON.parse(profile.wealth_indicators) : profile.wealth_indicators) : 
      {};
      
    const metadata = profile.metadata ? 
      (typeof profile.metadata === 'string' ? JSON.parse(profile.metadata) : profile.metadata) : 
      {};
    
    // Convert snake_case to camelCase
    const formattedProfile = {
      id: profile.id,
      ownerId: profile.owner_id,
      estimatedNetWorth,
      wealthComposition,
      income,
      philanthropicActivity,
      dataSources,
      wealthIndicators,
      metadata,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };
    
    // Add virtual properties
    formattedProfile.wealthTier = this.getWealthTier(formattedProfile);
    formattedProfile.formattedNetWorth = this.getFormattedNetWorth(formattedProfile);
    formattedProfile.confidenceDescription = this.getConfidenceDescription(formattedProfile);
    formattedProfile.primaryWealthSource = this.getPrimaryWealthSource(formattedProfile);
    
    return formattedProfile;
  }
}

module.exports = WealthProfile;