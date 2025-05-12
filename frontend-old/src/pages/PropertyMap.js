import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMapProperties, fetchSavedMapViews } from '../store/actions/mapActions';
import PropertyMapComponent from '../components/map/PropertyMap';
import Spinner from '../components/layout/Spinner';
import './PropertyMap.css';

const PropertyMap = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error, savedMapViews } = useSelector(state => state.map);
  const [initialViewLoaded, setInitialViewLoaded] = useState(false);

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const viewId = queryParams.get('view');

  useEffect(() => {
    // Fetch saved map views
    dispatch(fetchSavedMapViews());
  }, [dispatch]);

  useEffect(() => {
    // If a specific view is requested and saved views are loaded
    if (viewId && savedMapViews.length > 0 && !initialViewLoaded) {
      const savedView = savedMapViews.find(view => view._id === viewId);
      
      if (savedView) {
        // Apply the saved view settings
        const { center, zoom, filters } = savedView;
        
        // Fetch properties with the saved filters
        dispatch(fetchMapProperties({
          bounds: getBoundsFromCenter(center, zoom),
          zoom,
          ...filters
        }));
        
        setInitialViewLoaded(true);
      }
    }
  }, [viewId, savedMapViews, initialViewLoaded, dispatch]);

  // Helper function to estimate bounds from center and zoom
  const getBoundsFromCenter = (center, zoom) => {
    // This is a rough estimation - in a real app, you'd use a mapping library's methods
    const latOffset = 180 / (Math.pow(2, zoom) * 10);
    const lngOffset = 360 / (Math.pow(2, zoom) * 10);
    
    return [
      center.lat - latOffset, // south
      center.lng - lngOffset, // west
      center.lat + latOffset, // north
      center.lng + lngOffset  // east
    ].join(',');
  };

  if (loading && !initialViewLoaded) {
    return <Spinner />;
  }

  return (
    <div className="property-map-page">
      <PropertyMapComponent />
    </div>
  );
};

export default PropertyMap;