import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { bookmarkProperty, removeBookmark } from '../../store/actions/propertyActions';
import { formatCurrency, formatDate } from '../../utils/formatting';
import './PropertyCard.css';

const PropertyCard = ({ property, compact = false }) => {
  const dispatch = useDispatch();
  const [isBookmarked, setIsBookmarked] = useState(property.isBookmarked || false);
  
  // Format address for display
  const formatAddress = (address) => {
    if (!address) return 'Address not available';
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  };
  
  // Get property image URL or placeholder
  const getPropertyImage = () => {
    if (property.images && property.images.length > 0) {
      return property.images[0].url;
    }
    return `/assets/images/property-placeholder-${property.propertyType || 'default'}.jpg`;
  };
  
  // Handle bookmark toggle
  const handleBookmarkToggle = () => {
    if (isBookmarked) {
      dispatch(removeBookmark(property._id));
    } else {
      dispatch(bookmarkProperty(property._id));
    }
    setIsBookmarked(!isBookmarked);
  };
  
  // Render compact version (for map popups)
  if (compact) {
    return (
      <div className="property-card-compact">
        <img 
          src={getPropertyImage()} 
          alt={formatAddress(property.address)} 
          className="property-image-small"
        />
        <div className="property-card-compact-content">
          <h4>{formatAddress(property.address)}</h4>
          {property.valuation && property.valuation.marketValue && (
            <p className="property-value">{formatCurrency(property.valuation.marketValue)}</p>
          )}
          <Link to={`/properties/${property._id}`} className="view-details-btn">
            View Details
          </Link>
        </div>
      </div>
    );
  }
  
  // Render full property card
  return (
    <div className="property-card">
      <div className="property-card-header">
        <img 
          src={getPropertyImage()} 
          alt={formatAddress(property.address)} 
          className="property-image"
        />
        <button 
          className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
          onClick={handleBookmarkToggle}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          <i className={`fa ${isBookmarked ? 'fa-bookmark' : 'fa-bookmark-o'}`}></i>
        </button>
      </div>
      
      <div className="property-card-content">
        <h3>{formatAddress(property.address)}</h3>
        
        <div className="property-type-badge">
          {property.propertyType?.replace('_', ' ')}
        </div>
        
        {property.valuation && property.valuation.marketValue && (
          <div className="property-value">
            <strong>{formatCurrency(property.valuation.marketValue)}</strong>
          </div>
        )}
        
        <div className="property-details">
          {property.details && (
            <>
              {property.details.bedrooms && (
                <div className="detail-item">
                  <i className="fa fa-bed"></i>
                  <span>{property.details.bedrooms} BR</span>
                </div>
              )}
              
              {property.details.bathrooms && (
                <div className="detail-item">
                  <i className="fa fa-bath"></i>
                  <span>{property.details.bathrooms} BA</span>
                </div>
              )}
              
              {property.details.squareFeet && (
                <div className="detail-item">
                  <i className="fa fa-expand"></i>
                  <span>{property.details.squareFeet.toLocaleString()} sqft</span>
                </div>
              )}
              
              {property.details.yearBuilt && (
                <div className="detail-item">
                  <i className="fa fa-calendar"></i>
                  <span>Built {property.details.yearBuilt}</span>
                </div>
              )}
            </>
          )}
        </div>
        
        {property.saleHistory && property.saleHistory.length > 0 && (
          <div className="last-sale">
            <p>
              <strong>Last Sale:</strong> {formatCurrency(property.saleHistory[0].price)} 
              <span className="sale-date">
                {formatDate(property.saleHistory[0].date)}
              </span>
            </p>
          </div>
        )}
        
        {property.currentOwnership && property.currentOwnership.length > 0 && (
          <div className="ownership-info">
            <p>
              <strong>Owner:</strong> 
              <Link to={`/owners/${property.currentOwnership[0].ownerId}`}>
                {property.currentOwnership[0].ownerName || 'View Owner Details'}
              </Link>
            </p>
          </div>
        )}
        
        <div className="property-card-actions">
          <Link to={`/properties/${property._id}`} className="btn btn-primary">
            Full Details
          </Link>
          
          <Link to={`/properties/${property._id}/wealth-insights`} className="btn btn-secondary">
            Wealth Insights
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;