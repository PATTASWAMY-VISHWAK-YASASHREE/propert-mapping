/**
 * Wealth profiles routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');
const db = require('../db');

/**
 * @route   GET /api/wealth/profiles
 * @desc    Get all wealth profiles
 * @access  Private
 */
router.get('/profiles', protect, asyncHandler(async (req, res) => {
  // Build query based on filters
  let query = `
    SELECT wp.*, 
      COALESCE(o.name, oi.name) as owner_name,
      CASE 
        WHEN o.id IS NOT NULL THEN 'company'
        WHEN oi.id IS NOT NULL THEN 'individual'
        ELSE NULL
      END as owner_type
    FROM wealth_profiles wp
    LEFT JOIN owners o ON wp.owner_id = o.id
    LEFT JOIN owners oi ON wp.owner_individual_id = oi.id
    WHERE 1=1
  `;
  
  const queryParams = [];
  let paramIndex = 1;
  
  // Filter by company
  if (req.user.company_id) {
    query += ` AND (
      o.company_id = $${paramIndex} OR 
      oi.company_id = $${paramIndex}
    )`;
    queryParams.push(req.user.company_id);
    paramIndex++;
  }
  
  // Apply filters from query params
  if (req.query.min_net_worth) {
    query += ` AND wp.estimated_net_worth >= $${paramIndex}`;
    queryParams.push(req.query.min_net_worth);
    paramIndex++;
  }
  
  if (req.query.max_net_worth) {
    query += ` AND wp.estimated_net_worth <= $${paramIndex}`;
    queryParams.push(req.query.max_net_worth);
    paramIndex++;
  }
  
  if (req.query.income_range) {
    query += ` AND wp.income_range = $${paramIndex}`;
    queryParams.push(req.query.income_range);
    paramIndex++;
  }
  
  // Add pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  
  // Get total count for pagination
  const countQuery = query.replace('SELECT wp.*, COALESCE(o.name, oi.name) as owner_name', 'SELECT COUNT(*)');
  const countResult = await db.query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].count);
  
  // Add sorting and pagination to query
  query += ` ORDER BY wp.${req.query.sort_by || 'estimated_net_worth'} ${req.query.sort_order || 'DESC'}`;
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
 * @route   GET /api/wealth/profiles/:id
 * @desc    Get single wealth profile
 * @access  Private
 */
router.get('/profiles/:id', protect, asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT wp.*, 
      COALESCE(o.name, oi.name) as owner_name,
      CASE 
        WHEN o.id IS NOT NULL THEN 'company'
        WHEN oi.id IS NOT NULL THEN 'individual'
        ELSE NULL
      END as owner_type
     FROM wealth_profiles wp
     LEFT JOIN owners o ON wp.owner_id = o.id
     LEFT JOIN owners oi ON wp.owner_individual_id = oi.id
     WHERE wp.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Wealth profile not found'
    });
  }

  res.status(200).json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * @route   POST /api/wealth/profiles
 * @desc    Create a wealth profile
 * @access  Private
 */
router.post('/profiles', protect, asyncHandler(async (req, res) => {
  const { 
    owner_id, owner_individual_id, estimated_net_worth, income_range,
    liquid_assets_range, real_estate_holdings, source
  } = req.body;

  // Check that either owner_id or owner_individual_id is provided, but not both
  if ((!owner_id && !owner_individual_id) || (owner_id && owner_individual_id)) {
    return res.status(400).json({
      success: false,
      error: 'Either owner_id or owner_individual_id must be provided, but not both'
    });
  }

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
        error: 'Not authorized to create wealth profile for this owner'
      });
    }
  }

  // Check if individual owner exists and belongs to user's company
  if (owner_individual_id) {
    const ownerResult = await db.query(
      `SELECT * FROM owners WHERE id = $1`,
      [owner_individual_id]
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
        error: 'Not authorized to create wealth profile for this owner'
      });
    }
  }

  // Create wealth profile
  const result = await db.query(
    `INSERT INTO wealth_profiles (
      owner_id, owner_individual_id, estimated_net_worth, income_range,
      liquid_assets_range, real_estate_holdings, source, last_updated,
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
    RETURNING *`,
    [
      owner_id, owner_individual_id, estimated_net_worth, income_range,
      liquid_assets_range, real_estate_holdings, source, req.user.id
    ]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * @route   PUT /api/wealth/profiles/:id
 * @desc    Update wealth profile
 * @access  Private
 */
router.put('/profiles/:id', protect, asyncHandler(async (req, res) => {
  // Get wealth profile
  const profileResult = await db.query(
    `SELECT wp.*, o.company_id as owner_company_id, oi.company_id as individual_company_id
     FROM wealth_profiles wp
     LEFT JOIN owners o ON wp.owner_id = o.id
     LEFT JOIN owners oi ON wp.owner_individual_id = oi.id
     WHERE wp.id = $1`,
    [req.params.id]
  );

  if (profileResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Wealth profile not found'
    });
  }

  const profile = profileResult.rows[0];

  // Check if user has access to this profile
  const ownerCompanyId = profile.owner_company_id || profile.individual_company_id;
  
  if (ownerCompanyId !== req.user.company_id) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to update this wealth profile'
    });
  }

  // Update wealth profile
  const { 
    estimated_net_worth, income_range, liquid_assets_range,
    real_estate_holdings, source
  } = req.body;

  const result = await db.query(
    `UPDATE wealth_profiles
     SET estimated_net_worth = $1, income_range = $2, liquid_assets_range = $3,
         real_estate_holdings = $4, source = $5, last_updated = NOW(),
         updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [
      estimated_net_worth || profile.estimated_net_worth,
      income_range || profile.income_range,
      liquid_assets_range || profile.liquid_assets_range,
      real_estate_holdings || profile.real_estate_holdings,
      source || profile.source,
      req.params.id
    ]
  );

  res.status(200).json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * @route   DELETE /api/wealth/profiles/:id
 * @desc    Delete wealth profile
 * @access  Private
 */
router.delete('/profiles/:id', protect, asyncHandler(async (req, res) => {
  // Get wealth profile
  const profileResult = await db.query(
    `SELECT wp.*, o.company_id as owner_company_id, oi.company_id as individual_company_id
     FROM wealth_profiles wp
     LEFT JOIN owners o ON wp.owner_id = o.id
     LEFT JOIN owners oi ON wp.owner_individual_id = oi.id
     WHERE wp.id = $1`,
    [req.params.id]
  );

  if (profileResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Wealth profile not found'
    });
  }

  const profile = profileResult.rows[0];

  // Check if user has access to this profile
  const ownerCompanyId = profile.owner_company_id || profile.individual_company_id;
  
  if (ownerCompanyId !== req.user.company_id) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to delete this wealth profile'
    });
  }

  // Delete wealth profile
  await db.query(
    `DELETE FROM wealth_profiles
     WHERE id = $1`,
    [req.params.id]
  );

  res.status(200).json({
    success: true,
    data: {}
  });
}));

module.exports = router;