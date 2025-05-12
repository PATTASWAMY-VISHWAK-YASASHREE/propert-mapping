/**
 * Property model
 */

const db = require('../db');

/**
 * Property class for handling property-related database operations
 */
class Property {
  /**
   * Create a new property
   * @param {Object} propertyData - Property data
   * @returns {Promise<Object>} - Created property
   */
  static async create(propertyData) {
    const {
      address,
      city,
      state,
      zip,
      lat,
      lng,
      propertyType,
      bedrooms,
      bathrooms,
      squareFeet,
      lotSize,
      yearBuilt,
      value,
      lastSaleDate,
      lastSaleAmount,
      ownerId
    } = propertyData;
    
    // Insert property into database
    const query = `
      INSERT INTO properties (
        address, city, state, zip, lat, lng, property_type, bedrooms, bathrooms,
        square_feet, lot_size, year_built, value, last_sale_date, last_sale_amount, owner_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    
    const values = [
      address,
      city,
      state,
      zip,
      lat,
      lng,
      propertyType,
      bedrooms,
      bathrooms,
      squareFeet,
      lotSize,
      yearBuilt,
      value,
      lastSaleDate,
      lastSaleAmount,
      ownerId
    ];
    
    const { rows } = await db.query(query, values);
    return rows[0];
  }
  
  /**
   * Find a property by ID
   * @param {string} id - Property ID
   * @returns {Promise<Object|null>} - Property or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT p.*, o.name as owner_name, o.email as owner_email, o.phone as owner_phone
      FROM properties p
      LEFT JOIN owners o ON p.owner_id = o.id
      WHERE p.id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (!rows.length) {
      return null;
    }
    
    // Format the property data
    const property = rows[0];
    return this._formatPropertyData(property);
  }
  
  /**
   * Update a property
   * @param {string} id - Property ID
   * @param {Object} propertyData - Property data to update
   * @returns {Promise<Object>} - Updated property
   */
  static async update(id, propertyData) {
    // Build query dynamically based on provided fields
    let query = 'UPDATE properties SET ';
    const values = [];
    const updateFields = [];
    let paramIndex = 1;
    
    // Map property data fields to database columns
    const fieldMap = {
      address: 'address',
      city: 'city',
      state: 'state',
      zip: 'zip',
      lat: 'lat',
      lng: 'lng',
      propertyType: 'property_type',
      bedrooms: 'bedrooms',
      bathrooms: 'bathrooms',
      squareFeet: 'square_feet',
      lotSize: 'lot_size',
      yearBuilt: 'year_built',
      value: 'value',
      lastSaleDate: 'last_sale_date',
      lastSaleAmount: 'last_sale_amount',
      ownerId: 'owner_id'
    };
    
    // Add fields to update
    for (const [field, value] of Object.entries(propertyData)) {
      if (value !== undefined && fieldMap[field]) {
        updateFields.push(`${fieldMap[field]} = $${paramIndex++}`);
        values.push(value);
      }
    }
    
    // If no fields to update, return the property
    if (updateFields.length === 0) {
      return this.findById(id);
    }
    
    query += updateFields.join(', ');
    query += ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);
    
    const { rows } = await db.query(query, values);
    
    if (!rows.length) {
      return null;
    }
    
    return this._formatPropertyData(rows[0]);
  }
  
  /**
   * Delete a property
   * @param {string} id - Property ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    const query = `
      DELETE FROM properties
      WHERE id = $1
    `;
    
    const { rowCount } = await db.query(query, [id]);
    return rowCount > 0;
  }
  
  /**
   * Get all properties with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - List of properties
   */
  static async getAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      city,
      state,
      zip,
      minValue,
      maxValue,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      propertyType,
      ownerId,
      bounds
    } = options;
    
    let query = `
      SELECT p.*, o.name as owner_name, o.email as owner_email, o.phone as owner_phone
      FROM properties p
      LEFT JOIN owners o ON p.owner_id = o.id
      WHERE 1 = 1
    `;
    
    const values = [];
    let paramIndex = 1;
    
    // Add filters
    if (city) {
      query += ` AND p.city = $${paramIndex++}`;
      values.push(city);
    }
    
    if (state) {
      query += ` AND p.state = $${paramIndex++}`;
      values.push(state);
    }
    
    if (zip) {
      query += ` AND p.zip = $${paramIndex++}`;
      values.push(zip);
    }
    
    if (minValue !== undefined) {
      query += ` AND p.value >= $${paramIndex++}`;
      values.push(minValue);
    }
    
    if (maxValue !== undefined) {
      query += ` AND p.value <= $${paramIndex++}`;
      values.push(maxValue);
    }
    
    if (minBedrooms !== undefined) {
      query += ` AND p.bedrooms >= $${paramIndex++}`;
      values.push(minBedrooms);
    }
    
    if (maxBedrooms !== undefined) {
      query += ` AND p.bedrooms <= $${paramIndex++}`;
      values.push(maxBedrooms);
    }
    
    if (minBathrooms !== undefined) {
      query += ` AND p.bathrooms >= $${paramIndex++}`;
      values.push(minBathrooms);
    }
    
    if (maxBathrooms !== undefined) {
      query += ` AND p.bathrooms <= $${paramIndex++}`;
      values.push(maxBathrooms);
    }
    
    if (propertyType) {
      query += ` AND p.property_type = $${paramIndex++}`;
      values.push(propertyType);
    }
    
    if (ownerId) {
      query += ` AND p.owner_id = $${paramIndex++}`;
      values.push(ownerId);
    }
    
    // Add bounds filter if provided
    if (bounds && bounds.northeast && bounds.southwest) {
      query += ` AND p.lat BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      values.push(bounds.southwest.lat, bounds.northeast.lat);
      
      query += ` AND p.lng BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      values.push(bounds.southwest.lng, bounds.northeast.lng);
    }
    
    // Add pagination
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    values.push(limit, offset);
    
    const { rows } = await db.query(query, values);
    
    // Format property data
    return rows.map(property => this._formatPropertyData(property));
  }
  
  /**
   * Count properties with filtering
   * @param {Object} options - Query options
   * @returns {Promise<number>} - Property count
   */
  static async count(options = {}) {
    const {
      city,
      state,
      zip,
      minValue,
      maxValue,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      propertyType,
      ownerId,
      bounds
    } = options;
    
    let query = `
      SELECT COUNT(*) as count
      FROM properties p
      WHERE 1 = 1
    `;
    
    const values = [];
    let paramIndex = 1;
    
    // Add filters
    if (city) {
      query += ` AND p.city = $${paramIndex++}`;
      values.push(city);
    }
    
    if (state) {
      query += ` AND p.state = $${paramIndex++}`;
      values.push(state);
    }
    
    if (zip) {
      query += ` AND p.zip = $${paramIndex++}`;
      values.push(zip);
    }
    
    if (minValue !== undefined) {
      query += ` AND p.value >= $${paramIndex++}`;
      values.push(minValue);
    }
    
    if (maxValue !== undefined) {
      query += ` AND p.value <= $${paramIndex++}`;
      values.push(maxValue);
    }
    
    if (minBedrooms !== undefined) {
      query += ` AND p.bedrooms >= $${paramIndex++}`;
      values.push(minBedrooms);
    }
    
    if (maxBedrooms !== undefined) {
      query += ` AND p.bedrooms <= $${paramIndex++}`;
      values.push(maxBedrooms);
    }
    
    if (minBathrooms !== undefined) {
      query += ` AND p.bathrooms >= $${paramIndex++}`;
      values.push(minBathrooms);
    }
    
    if (maxBathrooms !== undefined) {
      query += ` AND p.bathrooms <= $${paramIndex++}`;
      values.push(maxBathrooms);
    }
    
    if (propertyType) {
      query += ` AND p.property_type = $${paramIndex++}`;
      values.push(propertyType);
    }
    
    if (ownerId) {
      query += ` AND p.owner_id = $${paramIndex++}`;
      values.push(ownerId);
    }
    
    // Add bounds filter if provided
    if (bounds && bounds.northeast && bounds.southwest) {
      query += ` AND p.lat BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      values.push(bounds.southwest.lat, bounds.northeast.lat);
      
      query += ` AND p.lng BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      values.push(bounds.southwest.lng, bounds.northeast.lng);
    }
    
    const { rows } = await db.query(query, values);
    return parseInt(rows[0].count);
  }
  
  /**
   * Format property data from database row
   * @param {Object} property - Database row
   * @returns {Object} - Formatted property
   * @private
   */
  static _formatPropertyData(property) {
    // Convert snake_case to camelCase
    const formattedProperty = {
      id: property.id,
      address: property.address,
      city: property.city,
      state: property.state,
      zip: property.zip,
      location: {
        lat: parseFloat(property.lat),
        lng: parseFloat(property.lng)
      },
      propertyType: property.property_type,
      bedrooms: property.bedrooms,
      bathrooms: parseFloat(property.bathrooms),
      squareFeet: property.square_feet,
      lotSize: parseFloat(property.lot_size),
      yearBuilt: property.year_built,
      value: parseFloat(property.value),
      lastSaleDate: property.last_sale_date,
      lastSaleAmount: parseFloat(property.last_sale_amount),
      createdAt: property.created_at,
      updatedAt: property.updated_at
    };
    
    // Add owner information if available
    if (property.owner_id) {
      formattedProperty.owner = {
        id: property.owner_id,
        name: property.owner_name,
        email: property.owner_email,
        phone: property.owner_phone
      };
    }
    
    return formattedProperty;
  }
}

module.exports = Property;