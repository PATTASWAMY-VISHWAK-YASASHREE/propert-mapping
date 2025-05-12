import React from 'react';
import './MapControls.css';

const MapControls = ({ mapType, onMapTypeChange, onSaveView }) => {
  return (
    <div className="map-controls">
      <div className="map-type-controls">
        <button
          className={`map-type-btn ${mapType === 'standard' ? 'active' : ''}`}
          onClick={() => onMapTypeChange('standard')}
          title="Standard Map"
        >
          <i className="fa fa-map"></i>
        </button>
        <button
          className={`map-type-btn ${mapType === 'satellite' ? 'active' : ''}`}
          onClick={() => onMapTypeChange('satellite')}
          title="Satellite View"
        >
          <i className="fa fa-globe"></i>
        </button>
      </div>
      
      <div className="map-action-controls">
        <button
          className="map-action-btn"
          onClick={onSaveView}
          title="Save Current View"
        >
          <i className="fa fa-bookmark"></i>
        </button>
      </div>
    </div>
  );
};

export default MapControls;