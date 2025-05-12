import React, { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import axios from 'axios';

const RegridMap = () => {
  useEffect(() => {
    // Initialize Mapbox
    mapboxgl.accessToken = process.env.REACT_APP_REGRID_API_KEY;

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-95.7129, 37.0902], // USA center
      zoom: 4,
    });

    map.on('load', async () => {
      try {
        // Fetch Regrid tiles from the backend
        const response = await axios.get('/api/regrid/tiles', {
          params: { zoom: 4, lat: 37.0902, lng: -95.7129 },
        });

        // Add Regrid tiles as a source
        map.addSource('regrid-tiles', {
          type: 'raster',
          tiles: response.data.tiles, // Replace with the actual tile URLs from Regrid
          tileSize: 256,
        });

        // Add a layer to display the tiles
        map.addLayer({
          id: 'regrid-layer',
          type: 'raster',
          source: 'regrid-tiles',
        });
      } catch (error) {
        console.error('Error loading Regrid tiles:', error.message);
      }
    });

    return () => map.remove();
  }, []);

  return <div id="map" style={{ width: '100%', height: '100vh' }} />;
};

export default RegridMap;