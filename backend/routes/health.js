/**
 * Health check routes
 */

const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Check API health
 * @access  Public
 */
router.get('/', function(req, res) {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;