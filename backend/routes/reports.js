/**
 * Reports routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');
const db = require('../db');

/**
 * @route   GET /api/reports
 * @desc    Get all reports
 * @access  Private
 */
router.get('/', protect, asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT * FROM reports
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [req.user.id]
  );

  res.status(200).json({
    success: true,
    count: result.rows.length,
    data: result.rows
  });
}));

/**
 * @route   GET /api/reports/:id
 * @desc    Get single report
 * @access  Private
 */
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT * FROM reports
     WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Report not found'
    });
  }

  res.status(200).json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * @route   POST /api/reports
 * @desc    Create a report
 * @access  Private
 */
router.post('/', protect, asyncHandler(async (req, res) => {
  const { name, description, type, parameters } = req.body;

  const result = await db.query(
    `INSERT INTO reports (name, description, type, parameters, user_id, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, description, type, parameters, req.user.id, 'pending']
  );

  // In a real application, you would trigger a background job to generate the report
  // For now, we'll just update the status to 'completed' and add some dummy results
  const reportId = result.rows[0].id;
  
  // Generate dummy results based on report type
  let results;
  
  if (type === 'property_values') {
    results = {
      total_properties: 150,
      total_value: 45000000,
      average_value: 300000,
      median_value: 275000,
      value_distribution: {
        '0-100k': 15,
        '100k-250k': 45,
        '250k-500k': 65,
        '500k-1M': 20,
        '1M+': 5
      }
    };
  } else if (type === 'owner_analysis') {
    results = {
      total_owners: 85,
      owners_by_type: {
        'Individual': 45,
        'Company': 25,
        'Trust': 10,
        'LLC': 5
      },
      top_owners: [
        { name: 'ABC Properties LLC', properties: 12, total_value: 4500000 },
        { name: 'XYZ Investments', properties: 8, total_value: 3200000 },
        { name: 'John Smith', properties: 5, total_value: 1800000 }
      ]
    };
  } else {
    results = {
      message: 'Report generated successfully',
      timestamp: new Date().toISOString()
    };
  }
  
  // Update report with results
  await db.query(
    `UPDATE reports
     SET status = $1, results = $2, updated_at = NOW()
     WHERE id = $3`,
    ['completed', results, reportId]
  );

  // Get updated report
  const updatedResult = await db.query(
    `SELECT * FROM reports
     WHERE id = $1`,
    [reportId]
  );

  res.status(201).json({
    success: true,
    data: updatedResult.rows[0]
  });
}));

/**
 * @route   DELETE /api/reports/:id
 * @desc    Delete report
 * @access  Private
 */
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const result = await db.query(
    `DELETE FROM reports
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Report not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
}));

/**
 * @route   POST /api/reports/:id/schedule
 * @desc    Schedule a report
 * @access  Private
 */
router.post('/:id/schedule', protect, asyncHandler(async (req, res) => {
  const { frequency, next_run } = req.body;

  // Get report
  const reportResult = await db.query(
    `SELECT * FROM reports
     WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );

  if (reportResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Report not found'
    });
  }

  // Update report schedule
  const result = await db.query(
    `UPDATE reports
     SET scheduled = true, schedule_frequency = $1, next_run = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [frequency, next_run, req.params.id]
  );

  res.status(200).json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * @route   DELETE /api/reports/:id/schedule
 * @desc    Cancel report schedule
 * @access  Private
 */
router.delete('/:id/schedule', protect, asyncHandler(async (req, res) => {
  // Get report
  const reportResult = await db.query(
    `SELECT * FROM reports
     WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );

  if (reportResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Report not found'
    });
  }

  // Update report schedule
  const result = await db.query(
    `UPDATE reports
     SET scheduled = false, schedule_frequency = NULL, next_run = NULL, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [req.params.id]
  );

  res.status(200).json({
    success: true,
    data: result.rows[0]
  });
}));

module.exports = router;