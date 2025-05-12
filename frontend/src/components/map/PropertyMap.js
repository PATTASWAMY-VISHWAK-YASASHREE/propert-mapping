import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { Paper, Typography, CircularProgress } from '@material-ui/core';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { setMapBounds, setMapCenter, setMapZoom } from '../../store/actions/mapActions';
import { MAP_CONFIG } from '../../config';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const useStyles = makeStyles((theme) => ({
  mapContainer: {
    height: 'calc(100vh - 64px)',
    width: '100%',
    position: 'relative'
  },
  map: {
    height: '100%',
    width: '100%',
    zIndex: 1
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 2
  },
  propertyPopup: {
    padding: theme.spacing(1),
    '& h3': {
      margin: 0,
      marginBottom: theme.spacing(1),
      fontSize: '1rem'
    },
    '& p': {
      margin: 0,
      marginBottom: theme.spacing(0.5),
      fontSize: '0.875rem'
    }
  }
}));

/**
 * Property Map Component
 * Displays properties on an interactive map using Leaflet and OpenStreetMap
 */
const PropertyMap = ({ properties = [] }) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersLayer = useRef(null);
  const [loading, setLoading] = useState(true);
  
  const { center, zoom, bounds, selectedLocation } = useSelector(state => state.map);
  const { filters } = useSelector(state => state.properties);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Create map instance
    leafletMap.current = L.map(mapRef.current, {
      center: center || MAP_CONFIG.defaultCenter,
      zoom: zoom || MAP_CONFIG.defaultZoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      zoomControl: false
    });
    
    // Add zoom control to top-right
    L.control.zoom({
      position: 'topright'
    }).addTo(leafletMap.current);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap.current);
    
    // Create marker cluster group
    markersLayer.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true
    }).addTo(leafletMap.current);
    
    // Map event listeners
    leafletMap.current.on('moveend', handleMapMoveEnd);
    leafletMap.current.on('zoomend', handleMapZoomEnd);
    
    setLoading(false);
    
    // Cleanup on unmount
    return () => {
      if (leafletMap.current) {
        leafletMap.current.off('moveend', handleMapMoveEnd);
        leafletMap.current.off('zoomend', handleMapZoomEnd);
        leafletMap.current.remove();
      }
    };
  }, []);

  // Update map when center or zoom changes
  useEffect(() => {
    if (!leafletMap.current) return;
    
    if (center && zoom) {
      leafletMap.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update map when selected location changes
  useEffect(() => {
    if (!leafletMap.current || !selectedLocation) return;
    
    const { lat, lng } = selectedLocation.location;
    
    // Create a marker for the selected location
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'selected-location-marker',
        html: '<div style="background-color: #4285f4; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    });
    
    // Add popup with location info
    marker.bindPopup(
      `<div class="${classes.propertyPopup}">
        <h3>${selectedLocation.formattedAddress}</h3>
      </div>`
    );
    
    // Add marker to map
    marker.addTo(leafletMap.current);
    marker.openPopup();
    
    // Center map on selected location
    leafletMap.current.setView([lat, lng], 16);
    
    // Remove marker when selected location changes
    return () => {
      leafletMap.current.removeLayer(marker);
    };
  }, [selectedLocation]);

  // Update markers when properties change
  useEffect(() => {
    if (!markersLayer.current) return;
    
    // Clear existing markers
    markersLayer.current.clearLayers();
    
    // Add markers for properties
    properties.forEach(property => {
      if (!property.location || !property.location.lat || !property.location.lng) return;
      
      const { lat, lng } = property.location;
      
      // Create marker
      const marker = L.marker([lat, lng]);
      
      // Create popup content
      const popupContent = `
        <div class="${classes.propertyPopup}">
          <h3>${property.address}</h3>
          <p><strong>Owner:</strong> ${property.owner?.name || 'Unknown'}</p>
          <p><strong>Value:</strong> $${property.value?.toLocaleString() || 'N/A'}</p>
          <p><strong>Type:</strong> ${property.type || 'N/A'}</p>
        </div>
      `;
      
      // Add popup to marker
      marker.bindPopup(popupContent);
      
      // Add marker to cluster layer
      markersLayer.current.addLayer(marker);
    });
    
    // Fit map to markers if there are any
    if (properties.length > 0) {
      const bounds = markersLayer.current.getBounds();
      if (bounds.isValid()) {
        leafletMap.current.fitBounds(bounds);
      }
    }
  }, [properties]);

  // Handle map move event
  const handleMapMoveEnd = () => {
    if (!leafletMap.current) return;
    
    const center = leafletMap.current.getCenter();
    const bounds = leafletMap.current.getBounds();
    
    dispatch(setMapCenter({
      lat: center.lat,
      lng: center.lng
    }));
    
    dispatch(setMapBounds({
      northeast: {
        lat: bounds.getNorthEast().lat,
        lng: bounds.getNorthEast().lng
      },
      southwest: {
        lat: bounds.getSouthWest().lat,
        lng: bounds.getSouthWest().lng
      }
    }));
  };

  // Handle map zoom event
  const handleMapZoomEnd = () => {
    if (!leafletMap.current) return;
    
    const zoom = leafletMap.current.getZoom();
    dispatch(setMapZoom(zoom));
  };

  return (
    <div className={classes.mapContainer}>
      {loading && (
        <div className={classes.loading}>
          <CircularProgress />
        </div>
      )}
      <div ref={mapRef} className={classes.map} />
    </div>
  );
};

export default PropertyMap;