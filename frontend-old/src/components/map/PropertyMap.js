import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { Paper, Typography, CircularProgress } from '@material-ui/core';
import { setMapBounds, setMapCenter, setMapZoom } from '../../store/actions/mapActions';
import { MAP_CONFIG } from '../../config';

const useStyles = makeStyles((theme) => ({
  mapContainer: {
    height: 'calc(100vh - 64px)',
    width: '100%',
    position: 'relative'
  },
  map: {
    height: '100%',
    width: '100%',
    zIndex: 1,
    backgroundColor: '#e5e3df', // Map background color
    backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0)',
    backgroundSize: '40px 40px',
    backgroundPosition: '0 0, 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  mapOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: theme.spacing(3),
    borderRadius: theme.shape.borderRadius,
    textAlign: 'center',
    maxWidth: '80%'
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 2
  },
  propertyMarker: {
    position: 'absolute',
    width: '20px',
    height: '20px',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '50%',
    border: '2px solid white',
    transform: 'translate(-50%, -50%)',
    cursor: 'pointer',
    zIndex: 2
  },
  roads: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'none'
  },
  horizontalRoad: {
    position: 'absolute',
    height: '10px',
    backgroundColor: '#d3d3d3',
    left: '10%',
    right: '10%'
  },
  verticalRoad: {
    position: 'absolute',
    width: '10px',
    backgroundColor: '#d3d3d3',
    top: '10%',
    bottom: '10%'
  }
}));

/**
 * Property Map Component
 * Currently displays a decorative map until the real API is integrated
 */
const PropertyMap = ({ properties = [] }) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  
  const { center, zoom, bounds, selectedLocation } = useSelector(state => state.map);
  const { filters } = useSelector(state => state.properties || {});

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Add some sample property markers for decoration
  const sampleProperties = [
    { id: 1, position: { top: '30%', left: '40%' } },
    { id: 2, position: { top: '45%', left: '55%' } },
    { id: 3, position: { top: '60%', left: '35%' } },
    { id: 4, position: { top: '25%', left: '65%' } },
    { id: 5, position: { top: '50%', left: '25%' } }
  ];

  // Add some decorative roads
  const roads = [
    { id: 'h1', type: 'horizontal', position: { top: '30%' } },
    { id: 'h2', type: 'horizontal', position: { top: '60%' } },
    { id: 'v1', type: 'vertical', position: { left: '40%' } },
    { id: 'v2', type: 'vertical', position: { left: '70%' } }
  ];

  return (
    <div className={classes.mapContainer}>
      {loading && (
        <div className={classes.loading}>
          <CircularProgress />
        </div>
      )}
      <div ref={mapRef} className={classes.map}>
        {/* Decorative roads */}
        <div className={classes.roads}>
          {!loading && roads.map(road => (
            road.type === 'horizontal' ? 
              <div 
                key={road.id}
                className={classes.horizontalRoad}
                style={{ top: road.position.top }}
              /> :
              <div 
                key={road.id}
                className={classes.verticalRoad}
                style={{ left: road.position.left }}
              />
          ))}
        </div>
        
        {/* Sample property markers */}
        {!loading && sampleProperties.map(property => (
          <div 
            key={property.id}
            className={classes.propertyMarker}
            style={{ top: property.position.top, left: property.position.left }}
          />
        ))}
        
        {/* Map overlay with information */}
        {!loading && (
          <div className={classes.mapOverlay}>
            <Typography variant="h5" gutterBottom>
              Property Map
            </Typography>
            <Typography variant="body1">
              This is a placeholder map. Real property data will be displayed here when connected to the API.
            </Typography>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyMap;