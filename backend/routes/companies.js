/**
 * Company routes
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');
const db = require('../db');

/**
 * @route   GET /api/companies
 * @desc    Get all companies
 * @access  Private (Admin)
 */
router.get('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT * FROM companies
     ORDER BY name`
  );

  res.status(200).json({
    success: true,
    count: result.rows.length,
    data: result.rows
  });
}));

/**
 * @route   GET /api/companies/:id
 * @desc    Get single company
 * @access  Private
 */
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT * FROM companies
     WHERE id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Company not found'
    });
  }

  const company = result.rows[0];

  // Check if user belongs to this company or is admin
  if (req.user.company_id !== company.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this company'
    });
  }

  res.status(200).json({
    success: true,
    data: company
  });
}));

/**
 * @route   POST /api/companies
 * @desc    Create a company
 * @access  Private (Admin)
 */
router.post('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { name, website, industry, size, description } = req.body;

  const result = await db.query(
    `INSERT INTO companies (name, website, industry, size, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, website, industry, size, description]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * @route   PUT /api/companies/:id
 * @desc    Update company
 * @access  Private (Admin or Company Admin)
 */
router.put('/:id', protect, asyncHandler(async (req, res) => {
  // Get company
  const companyResult = await db.query(
    `SELECT * FROM companies
     WHERE id = $1`,
    [req.params.id]
  );

  if (companyResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Company not found'
    });
  }

  const company = companyResult.rows[0];

  // Check if user is admin or belongs to this company and is a company admin
  const isAdmin = req.user.role === 'admin';
  const isCompanyAdmin = req.user.company_id === company.id && req.user.role === 'admin';

  if (!isAdmin && !isCompanyAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to update this company'
    });
  }

  const { name, website, industry, size, description } = req.body;

  // Update company
  const updateResult = await db.query(
    `UPDATE companies
     SET name = $1, website = $2, industry = $3, size = $4, description = $5, updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [
      name || company.name,
      website || company.website,
      industry || company.industry,
      size || company.size,
      description || company.description,
      req.params.id
    ]
  );

  res.status(200).json({
    success: true,
    data: updateResult.rows[0]
  });
}));

/**
 * @route   DELETE /api/companies/:id
 * @desc    Delete company
 * @access  Private (Admin)
 */
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const result = await db.query(
    `DELETE FROM companies
     WHERE id = $1
     RETURNING *`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Company not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
}));

module.exports = router;