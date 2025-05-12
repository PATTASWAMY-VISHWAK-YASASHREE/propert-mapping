import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { saveMapView } from '../../store/actions/mapActions';
import './SaveMapViewModal.css';

const SaveMapViewModal = ({ center, zoom, filters, onClose }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }
    
    const viewData = {
      name,
      description: description.trim() || undefined,
      center,
      zoom,
      filters
    };
    
    dispatch(saveMapView(viewData));
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="save-map-view-modal">
        <div className="modal-header">
          <h3>Save Map View</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fa fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="viewName">Name</label>
            <input
              type="text"
              id="viewName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this view"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="viewDescription">Description (Optional)</label>
            <textarea
              id="viewDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description"
              rows="3"
            ></textarea>
          </div>
          
          <div className="view-details">
            <h4>View Details</h4>
            <p>
              <strong>Center:</strong> {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
            </p>
            <p>
              <strong>Zoom Level:</strong> {zoom}
            </p>
            {Object.keys(filters).length > 0 && (
              <div className="filters-summary">
                <strong>Filters Applied:</strong>
                <ul>
                  {Object.entries(filters).map(([key, value]) => (
                    <li key={key}>
                      {formatFilterName(key)}: {formatFilterValue(key, value)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save View
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper functions for formatting filter names and values
const formatFilterName = (key) => {
  switch (key) {
    case 'propertyType': return 'Property Type';
    case 'minValue': return 'Min Value';
    case 'maxValue': return 'Max Value';
    case 'minSize': return 'Min Size';
    case 'maxSize': return 'Max Size';
    case 'ownerWealthMin': return 'Min Owner Worth';
    case 'ownerWealthMax': return 'Max Owner Worth';
    default: return key.charAt(0).toUpperCase() + key.slice(1);
  }
};

const formatFilterValue = (key, value) => {
  if (key === 'propertyType') {
    return value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  if (key.includes('Value') || key.includes('Wealth')) {
    return `$${parseInt(value).toLocaleString()}`;
  }
  
  if (key.includes('Size')) {
    return `${parseInt(value).toLocaleString()} sqft`;
  }
  
  return value;
};

export default SaveMapViewModal;