import React from 'react';
import PropertyCard from './PropertyCard';
import './PropertyList.css';

const PropertyList = ({ properties, loading }) => {
  if (loading) {
    return (
      <div className="property-list-loading">
        <div className="spinner"></div>
        <p>Loading properties...</p>
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="no-properties">
        <i className="fa fa-home"></i>
        <h3>No Properties Found</h3>
        <p>Try adjusting your search criteria or map view.</p>
      </div>
    );
  }

  return (
    <div className="property-list">
      {properties.map(property => (
        <PropertyCard key={property._id} property={property} />
      ))}
    </div>
  );
};

export default PropertyList;