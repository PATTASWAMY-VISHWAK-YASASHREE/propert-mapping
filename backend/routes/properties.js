/**
 * Properties routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');
const db = require('../db');

/**
 * @route   GET /api/properties
 * @desc    Get all properties
 * @access  Private
 */
router.get('/', protect, asyncHandler(async (req, res) => {
  // Build query based on filters
  let query = `
    SELECT p.*, 
      o.name as owner_name, 
      o.email as owner_email
    FROM properties p
    LEFT JOIN owners o ON p.owner_id = o.id
    WHERE 1=1
  `;
  
  const queryParams = [];
  let paramIndex = 1;
  
  // Filter by company
  if (req.user.company_id) {
    query += ` AND (p.owner_id IN (SELECT id FROM owners WHERE company_id = $${paramIndex}))`;
    queryParams.push(req.user.company_id);
    paramIndex++;
  }
  
  // Apply filters from query params
  if (req.query.property_type) {
    query += ` AND p.property_type = $${paramIndex}`;
    queryParams.push(req.query.property_type);
    paramIndex++;
  }
  
  if (req.query.min_value) {
    query += ` AND p.value >= $${paramIndex}`;
    queryParams.push(req.query.min_value);
    paramIndex++;
  }
  
  if (req.query.max_value) {
    query += ` AND p.value <= $${paramIndex}`;
    queryParams.push(req.query.max_value);
    paramIndex++;
  }
  
  if (req.query.city) {
    query += ` AND p.city ILIKE $${paramIndex}`;
    queryParams.push(`%${req.query.city}%`);
    paramIndex++;
  }
  
  if (req.query.state) {
    query += ` AND p.state = $${paramIndex}`;
    queryParams.push(req.query.state);
    paramIndex++;
  }
  
  // Add pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  
  // Get total count for pagination
  const countQuery = query.replace('SELECT p.*, o.name as owner_name, o.email as owner_email', 'SELECT COUNT(*)');
  const countResult = await db.query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].count);
  
  // Add sorting and pagination to query
  query += ` ORDER BY p.${req.query.sort_by || 'created_at'} ${req.query.sort_order || 'DESC'}`;
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  queryParams.push(limit, startIndex);
  
  // Execute query
  const result = await db.query(query, queryParams);
  
  // Pagination result
  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
  
  res.status(200).json({
    success: true,
    count: result.rows.length,
    pagination,
    data: result.rows
  });
}));

/**
 * @route   GET /api/properties/:id
 * @desc    Get single property
 * @access  Private
 */
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT p.*, 
      o.name as owner_name, 
      o.email as owner_email
     FROM properties p
     LEFT JOIN owners o ON p.owner_id = o.id
     WHERE p.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Property not found'
    });
  }

  res.status(200).json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * @route   POST /api/properties
 * @desc    Create a property
 * @access  Private
 */
router.post('/', protect, asyncHandler(async (req, res) => {
  const { 
    address, city, state, zip, property_type, bedrooms, bathrooms,
    square_feet, lot_size, year_built, value, owner_id
  } = req.body;

  // Check if owner exists and belongs to user's company
  if (owner_id) {
    const ownerResult = await db.query(
      `SELECT * FROM owners WHERE id = $1`,
      [owner_id]
    );

    if (ownerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Owner not found'
      });
    }

    const owner = ownerResult.rows[0];

    if (owner.company_id !== req.user.company_id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to associate property with this owner'
      });
    }
  }

  // Create property
  const result = await db.query(
    `INSERT INTO properties (
      address, city, state, zip, property_type, bedrooms, bathrooms,
      square_feet, lot_size, year_built, value, owner_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      address, city, state, zip, property_type, bedrooms, bathrooms,
      square_feet, lot_size, year_built, value, owner_id
    ]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * @route   PUT /api/properties/:id
 * @desc    Update property
 * @access  Private
 */
router.put('/:id', protect, asyncHandler(async (req, res) => {
  // Get property
  const propertyResult = await db.query(
    `SELECT * FROM properties WHERE id = $1`,
    [req.params.id]
  );

  if (propertyResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Property not found'
    });
  }

  const property = propertyResult.rows[0];

  // Check if owner exists and belongs to user's company
  if (req.body.owner_id) {
    const ownerResult = await db.query(
      `SELECT * FROM owners WHERE id = $1`,
      [req.body.owner_id]
    );

    if (ownerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Owner not found'
      });
    }

    const owner = ownerResult.rows[0];

    if (owner.company_id !== req.user.company_id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to associate property with this owner'
      });
    }
  }

  // Update property
  const { 
    address, city, state, zip, property_type, bedrooms, bathrooms,
    square_feet, lot_size, year_built, value, owner_id
  } = req.body;

  const result = await db.query(
    `UPDATE properties
     SET address = $1, city = $2, state = $3, zip = $4, property_type = $5,
         bedrooms = $6, bathrooms = $7, square_feet = $8, lot_size = $9,
         year_built = $10, value = $11, owner_id = $12, updated_at = NOW()
     WHERE id = $13
     RETURNING *`,
    [
      address || property.address,
      city || property.city,
      state || property.state,
      zip || property.zip,
      property_type || property.property_type,
      bedrooms || property.bedrooms,
      bathrooms || property.bathrooms,
      square_feet || property.square_feet,
      lot_size || property.lot_size,
      year_built || property.year_built,
      value || property.value,
      owner_id || property.owner_id,
      req.params.id
    ]
  );

  res.status(200).json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete property
 * @access  Private
 */
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const result = await db.query(
    `DELETE FROM properties
     WHERE id = $1
     RETURNING *`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Property not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
}));

module.exports = router;