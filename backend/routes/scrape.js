const express = require('express');
const router = express.Router();
const propmapService = require('../services/propmapService');
const propwireScraper = require('../integrations/propWireScraper');
const fpsScraper = require('../integrations/fastPeopleSearchScraper');

// GET /api/scrape/propmap
router.get('/propmap', async (req, res) => {
  try {
    const data = await propmapService.getMappingData();
    res.json({ success: true, source: 'propmap', data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/scrape/propwire
router.get('/propwire', async (req, res) => {
  try {
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    const page = parseInt(req.query.page) || 1;
    const results = await propwireScraper.searchProperties(filters, page);
    res.json({ success: true, source: 'propwire', ...results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/scrape/fps
router.get('/fps', async (req, res) => {
  try {
    const { type, ...args } = req.query; // type: "name", "address", "phone"
    let results;
    if (type === "name") results = await fpsScraper.searchByName(args.firstName, args.lastName, args.state, args.city);
    else if (type === "address") results = await fpsScraper.searchByAddress(args.street, args.city, args.state);
    else if (type === "phone") results = await fpsScraper.searchByPhone(args.phoneNumber);
    else throw new Error("Missing or invalid search type");
    res.json({ success: true, source: 'fastpeoplesearch', ...results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;