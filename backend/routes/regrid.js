const express = require('express');
const router = express.Router();
const { getMapTiles } = require('../integrations/regridapi');

// Route to fetch Regrid map tiles
router.get('/tiles', async (req, res) => {
  try {
    const { zoom, lat, lng } = req.query;

    if (!zoom || !lat || !lng) {
      return res.status(400).json({ error: 'Missing required parameters: zoom, lat, lng' });
    }

    const tiles = await getMapTiles({ zoom, lat, lng });
    res.json(tiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;