/**
 * Map routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');
const db = require('../db');

/**
 * @route   GET /api/map/views
 * @desc    Get saved map views
 * @access  Private
 */
router.get('/views', protect, asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT * FROM saved_map_views
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
 * @route   POST /api/map/views
 * @desc    Save a map view
 * @access  Private
 */
router.post('/views', protect, asyncHandler(async (req, res) => {
  const { name, center_lat, center_lng, zoom, bounds, filters } = req.body;

  const result = await db.query(
    `INSERT INTO saved_map_views (
      user_id, name, center_lat, center_lng, zoom, bounds, filters
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [req.user.id, name, center_lat, center_lng, zoom, bounds, filters]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * @route   DELETE /api/map/views/:id
 * @desc    Delete a saved map view
 * @access  Private
 */
router.delete('/views/:id', protect, asyncHandler(async (req, res) => {
  const result = await db.query(
    `DELETE FROM saved_map_views
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Saved map view not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
}));

/**
 * @route   GET /api/map/geocode
 * @desc    Geocode an address
 * @access  Private
 */
router.get('/geocode', protect, asyncHandler(async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Please provide an address'
    });
  }

  // In a real implementation, you would call a geocoding service
  // This is a placeholder
  const result = {
    lat: 40.7128,
    lng: -74.006,
    formatted_address: address,
    confidence: 0.9
  };

  res.status(200).json({
    success: true,
    data: result
  });
}));

/**
 * @route   GET /api/map/reverse-geocode
 * @desc    Reverse geocode coordinates
 * @access  Private
 */
router.get('/reverse-geocode', protect, asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      error: 'Please provide lat and lng'
    });
  }

  // In a real implementation, you would call a geocoding service
  // This is a placeholder
  const result = {
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'USA'
  };

  res.status(200).json({
    success: true,
    data: result
  });
}));

module.exports = router;