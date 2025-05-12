/**
 * propmap.js - API routes for Propmap mapping data
 */
const express = require('express');
const router = express.Router();
const propmapService = require('../services/propmapService');

// GET /api/propmap/mapping
router.get('/mapping', async (req, res) => {
  try {
    const data = await propmapService.getMappingData();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;