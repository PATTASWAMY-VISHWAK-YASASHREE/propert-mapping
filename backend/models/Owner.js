/**
 * Owner Model
 * Represents a property owner (individual or entity)
 */

const db = require('../db');

/**
 * Owner class for handling owner-related database operations
 */
class Owner {
  /**
   * Create a new owner
   * @param {Object} ownerData - Owner data
   * @returns {Promise<Object>} - Created owner
   */
  static async create(ownerData) {
    const {
      type,
      individual = {},
      entity = {},
      contactInformation = {},
      relatedEntities = [],
      dataSources = [],
      metadata = {}
    } = ownerData;
    
    // Insert owner into database
    const query = `
      INSERT INTO owners (
        type, individual, entity, contact_information, 
        related_entities, data_sources, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      type,
      JSON.stringify(individual),
      JSON.stringify(entity),
      JSON.stringify(contactInformation),
      JSON.stringify(relatedEntities),
      JSON.stringify(dataSources),
      JSON.stringify(metadata)
    ];
    
    const { rows } = await db.query(query, values);
    return this._formatOwnerData(rows[0]);
  }
  
  /**
   * Find an owner by ID
   * @param {string} id - Owner ID
   * @returns {Promise<Object|null>} - Owner or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT *
      FROM owners
      WHERE id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (!rows.length) {
      return null;
    }
    
    return this._formatOwnerData(rows[0]);
  }
  
  /**
   * Update an owner
   * @param {string} id - Owner ID
   * @param {Object} ownerData - Owner data to update
   * @returns {Promise<Object>} - Updated owner
   */
  static async update(id, ownerData) {
    // Build query dynamically based on provided fields
    let query = 'UPDATE owners SET ';
    const values = [];
    const updateFields = [];
    let paramIndex = 1;
    
    // Map owner data fields to database columns
    const fieldMap = {
      type: 'type',
      individual: 'individual',
      entity: 'entity',
      contactInformation: 'contact_information',
      relatedEntities: 'related_entities',
      dataSources: 'data_sources',
      metadata: 'metadata'
    };
    
    // Add fields to update
    for (const [field, value] of Object.entries(ownerData)) {
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
    
    // If no fields to update, return the owner
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
    
    return this._formatOwnerData(rows[0]);
  }
  
  /**
   * Delete an owner
   * @param {string} id - Owner ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    const query = `
      DELETE FROM owners
      WHERE id = $1
    `;
    
    const { rowCount } = await db.query(query, [id]);
    return rowCount > 0;
  }
  
  /**
   * Get all owners with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - List of owners
   */
  static async getAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      type,
      name,
      city,
      state
    } = options;
    
    let query = `
      SELECT *
      FROM owners
      WHERE 1 = 1
    `;
    
    const values = [];
    let paramIndex = 1;
    
    // Add filters
    if (type) {
      query += ` AND type = $${paramIndex++}`;
      values.push(type);
    }
    
    if (name) {
      query += ` AND (
        (type = 'individual' AND 
          (individual->>'firstName' ILIKE $${paramIndex} OR 
           individual->>'lastName' ILIKE $${paramIndex}))
        OR 
        (type = 'entity' AND 
          (entity->>'name' ILIKE $${paramIndex} OR 
           entity->>'legalName' ILIKE $${paramIndex}))
      )`;
      values.push(`%${name}%`);
      paramIndex++;
    }
    
    if (city) {
      query += ` AND (
        contact_information->'address'->>'city' ILIKE $${paramIndex} OR
        contact_information->'mailingAddress'->>'city' ILIKE $${paramIndex}
      )`;
      values.push(`%${city}%`);
      paramIndex++;
    }
    
    if (state) {
      query += ` AND (
        contact_information->'address'->>'state' = $${paramIndex} OR
        contact_information->'mailingAddress'->>'state' = $${paramIndex}
      )`;
      values.push(state);
      paramIndex++;
    }
    
    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    values.push(limit, offset);
    
    const { rows } = await db.query(query, values);
    
    // Format owner data
    return rows.map(owner => this._formatOwnerData(owner));
  }
  
  /**
   * Count owners with filtering
   * @param {Object} options - Query options
   * @returns {Promise<number>} - Owner count
   */
  static async count(options = {}) {
    const { type, name, city, state } = options;
    
    let query = `
      SELECT COUNT(*) as count
      FROM owners
      WHERE 1 = 1
    `;
    
    const values = [];
    let paramIndex = 1;
    
    // Add filters
    if (type) {
      query += ` AND type = $${paramIndex++}`;
      values.push(type);
    }
    
    if (name) {
      query += ` AND (
        (type = 'individual' AND 
          (individual->>'firstName' ILIKE $${paramIndex} OR 
           individual->>'lastName' ILIKE $${paramIndex}))
        OR 
        (type = 'entity' AND 
          (entity->>'name' ILIKE $${paramIndex} OR 
           entity->>'legalName' ILIKE $${paramIndex}))
      )`;
      values.push(`%${name}%`);
      paramIndex++;
    }
    
    if (city) {
      query += ` AND (
        contact_information->'address'->>'city' ILIKE $${paramIndex} OR
        contact_information->'mailingAddress'->>'city' ILIKE $${paramIndex}
      )`;
      values.push(`%${city}%`);
      paramIndex++;
    }
    
    if (state) {
      query += ` AND (
        contact_information->'address'->>'state' = $${paramIndex} OR
        contact_information->'mailingAddress'->>'state' = $${paramIndex}
      )`;
      values.push(state);
      paramIndex++;
    }
    
    const { rows } = await db.query(query, values);
    return parseInt(rows[0].count);
  }
  
  /**
   * Get properties owned by an owner
   * @param {string} id - Owner ID
   * @returns {Promise<Array>} - List of properties
   */
  static async getProperties(id) {
    const query = `
      SELECT *
      FROM properties
      WHERE owner_id = $1
      ORDER BY created_at DESC
    `;
    
    const { rows } = await db.query(query, [id]);
    
    // Format property data (would need a Property model method)
    return rows;
  }
  
  /**
   * Get display name for an owner
   * @param {Object} owner - Owner object
   * @returns {string} - Display name
   */
  static getDisplayName(owner) {
    if (owner.type === 'individual') {
      const individual = owner.individual || {};
      let name = individual.firstName || '';
      if (individual.middleName) name += ` ${individual.middleName}`;
      if (individual.lastName) name += ` ${individual.lastName}`;
      if (individual.suffix) name += `, ${individual.suffix}`;
      return name.trim() || 'Unknown Individual';
    } else {
      const entity = owner.entity || {};
      return entity.name || entity.legalName || 'Unknown Entity';
    }
  }
  
  /**
   * Get primary address for an owner
   * @param {Object} owner - Owner object
   * @returns {Object|null} - Address object or null
   */
  static getPrimaryAddress(owner) {
    const contactInfo = owner.contactInformation || {};
    if (contactInfo.mailingAddress && contactInfo.mailingAddress.street) {
      return contactInfo.mailingAddress;
    }
    return contactInfo.address || null;
  }
  
  /**
   * Format address as string
   * @param {Object} addressObj - Address object
   * @returns {string} - Formatted address
   */
  static formatAddress(addressObj) {
    if (!addressObj || !addressObj.street) return 'No address on file';
    
    let address = addressObj.street;
    if (addressObj.unit) address += ` ${addressObj.unit}`;
    address += `, ${addressObj.city}, ${addressObj.state} ${addressObj.zipCode}`;
    if (addressObj.country && addressObj.country !== 'USA') {
      address += `, ${addressObj.country}`;
    }
    
    return address;
  }
  
  /**
   * Format owner data from database row
   * @param {Object} owner - Database row
   * @returns {Object} - Formatted owner
   * @private
   */
  static _formatOwnerData(owner) {
    // Parse JSON fields
    const individual = owner.individual ? 
      (typeof owner.individual === 'string' ? JSON.parse(owner.individual) : owner.individual) : 
      {};
      
    const entity = owner.entity ? 
      (typeof owner.entity === 'string' ? JSON.parse(owner.entity) : owner.entity) : 
      {};
      
    const contactInformation = owner.contact_information ? 
      (typeof owner.contact_information === 'string' ? JSON.parse(owner.contact_information) : owner.contact_information) : 
      {};
      
    const relatedEntities = owner.related_entities ? 
      (typeof owner.related_entities === 'string' ? JSON.parse(owner.related_entities) : owner.related_entities) : 
      [];
      
    const dataSources = owner.data_sources ? 
      (typeof owner.data_sources === 'string' ? JSON.parse(owner.data_sources) : owner.data_sources) : 
      [];
      
    const metadata = owner.metadata ? 
      (typeof owner.metadata === 'string' ? JSON.parse(owner.metadata) : owner.metadata) : 
      {};
    
    // Convert snake_case to camelCase
    const formattedOwner = {
      id: owner.id,
      type: owner.type,
      individual,
      entity,
      contactInformation,
      relatedEntities,
      dataSources,
      metadata,
      createdAt: owner.created_at,
      updatedAt: owner.updated_at
    };
    
    // Add virtual properties
    formattedOwner.displayName = this.getDisplayName(formattedOwner);
    
    return formattedOwner;
  }
}

module.exports = Owner;