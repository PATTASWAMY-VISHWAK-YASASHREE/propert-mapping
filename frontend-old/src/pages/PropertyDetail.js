import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProperty, bookmarkProperty, removeBookmark } from '../store/actions/propertyActions';
import { getPropertyWealthInsights } from '../store/actions/wealthActions';
import { formatCurrency, formatDate, formatSquareFeet } from '../utils/formatting';
import Spinner from '../components/layout/Spinner';
import './PropertyDetail.css';

const PropertyDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { property, loading, error } = useSelector(state => state.property);
  const { propertyInsights } = useSelector(state => state.wealth);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      dispatch(fetchProperty(id));
      dispatch(getPropertyWealthInsights(id));
    }
  }, [dispatch, id]);

  const handleBookmarkToggle = () => {
    if (property.isBookmarked) {
      dispatch(removeBookmark(property._id));
    } else {
      dispatch(bookmarkProperty(property._id));
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="property-detail-error">
        <h2>Error Loading Property</h2>
        <p>{error}</p>
        <Link to="/map" className="btn btn-primary">
          Return to Map
        </Link>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="property-detail-not-found">
        <h2>Property Not Found</h2>
        <p>The property you're looking for doesn't exist or has been removed.</p>
        <Link to="/map" className="btn btn-primary">
          Return to Map
        </Link>
      </div>
    );
  }

  return (
    <div className="property-detail-page">
      <div className="property-header">
        <div className="property-address">
          <h1>{property.formattedAddress}</h1>
          <div className="property-type-badge">
            {property.propertyType?.replace('_', ' ')}
          </div>
        </div>
        
        <div className="property-actions">
          <button 
            className={`bookmark-btn ${property.isBookmarked ? 'bookmarked' : ''}`}
            onClick={handleBookmarkToggle}
          >
            <i className={`fa ${property.isBookmarked ? 'fa-bookmark' : 'fa-bookmark-o'}`}></i>
            {property.isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          
          <button className="share-btn">
            <i className="fa fa-share-alt"></i>
            Share
          </button>
        </div>
      </div>
      
      <div className="property-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ownership' ? 'active' : ''}`}
          onClick={() => setActiveTab('ownership')}
        >
          Ownership
        </button>
        <button 
          className={`tab-btn ${activeTab === 'wealth' ? 'active' : ''}`}
          onClick={() => setActiveTab('wealth')}
        >
          Wealth Insights
        </button>
      </div>
      
      <div className="property-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="property-gallery">
              {property.images && property.images.length > 0 ? (
                <img 
                  src={property.images[0].url} 
                  alt={property.formattedAddress} 
                  className="property-main-image"
                />
              ) : (
                <div className="property-image-placeholder">
                  <i className="fa fa-home"></i>
                  <p>No image available</p>
                </div>
              )}
            </div>
            
            <div className="property-summary">
              <div className="property-value">
                <h2>{formatCurrency(property.valuation?.marketValue)}</h2>
                <p>Estimated Value</p>
              </div>
              
              <div className="property-specs">
                {property.details?.bedrooms && (
                  <div className="spec-item">
                    <i className="fa fa-bed"></i>
                    <span>{property.details.bedrooms}</span>
                    <p>Beds</p>
                  </div>
                )}
                
                {property.details?.bathrooms && (
                  <div className="spec-item">
                    <i className="fa fa-bath"></i>
                    <span>{property.details.bathrooms}</span>
                    <p>Baths</p>
                  </div>
                )}
                
                {property.details?.squareFeet && (
                  <div className="spec-item">
                    <i className="fa fa-expand"></i>
                    <span>{formatSquareFeet(property.details.squareFeet)}</span>
                    <p>Area</p>
                  </div>
                )}
                
                {property.details?.yearBuilt && (
                  <div className="spec-item">
                    <i className="fa fa-calendar"></i>
                    <span>{property.details.yearBuilt}</span>
                    <p>Year Built</p>
                  </div>
                )}
              </div>
              
              {property.saleHistory && property.saleHistory.length > 0 && (
                <div className="last-sale">
                  <h3>Last Sale</h3>
                  <p className="sale-price">
                    {formatCurrency(property.saleHistory[0].price)}
                  </p>
                  <p className="sale-date">
                    {formatDate(property.saleHistory[0].date)}
                  </p>
                </div>
              )}
            </div>
            
            <div className="property-location">
              <h3>Location</h3>
              <div className="property-map-preview">
                {/* Map preview would go here - using placeholder */}
                <div className="map-placeholder">
                  <i className="fa fa-map-marker"></i>
                  <p>Map preview</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="details-tab">
            <div className="property-details-section">
              <h3>Property Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Property Type</span>
                  <span className="detail-value">
                    {property.propertyType?.replace('_', ' ')}
                  </span>
                </div>
                
                {property.details?.bedrooms && (
                  <div className="detail-item">
                    <span className="detail-label">Bedrooms</span>
                    <span className="detail-value">{property.details.bedrooms}</span>
                  </div>
                )}
                
                {property.details?.bathrooms && (
                  <div className="detail-item">
                    <span className="detail-label">Bathrooms</span>
                    <span className="detail-value">{property.details.bathrooms}</span>
                  </div>
                )}
                
                {property.details?.squareFeet && (
                  <div className="detail-item">
                    <span className="detail-label">Square Feet</span>
                    <span className="detail-value">
                      {formatSquareFeet(property.details.squareFeet)}
                    </span>
                  </div>
                )}
                
                {property.details?.yearBuilt && (
                  <div className="detail-item">
                    <span className="detail-label">Year Built</span>
                    <span className="detail-value">{property.details.yearBuilt}</span>
                  </div>
                )}
                
                {property.details?.stories && (
                  <div className="detail-item">
                    <span className="detail-label">Stories</span>
                    <span className="detail-value">{property.details.stories}</span>
                  </div>
                )}
                
                {property.details?.parking && (
                  <div className="detail-item">
                    <span className="detail-label">Parking</span>
                    <span className="detail-value">{property.details.parking}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="property-valuation-section">
              <h3>Valuation</h3>
              <div className="details-grid">
                {property.valuation?.marketValue && (
                  <div className="detail-item">
                    <span className="detail-label">Market Value</span>
                    <span className="detail-value">
                      {formatCurrency(property.valuation.marketValue)}
                    </span>
                  </div>
                )}
                
                {property.valuation?.assessedValue && (
                  <div className="detail-item">
                    <span className="detail-label">Assessed Value</span>
                    <span className="detail-value">
                      {formatCurrency(property.valuation.assessedValue)}
                    </span>
                  </div>
                )}
                
                {property.valuation?.assessmentYear && (
                  <div className="detail-item">
                    <span className="detail-label">Assessment Year</span>
                    <span className="detail-value">
                      {property.valuation.assessmentYear}
                    </span>
                  </div>
                )}
                
                {property.taxes?.annualAmount && (
                  <div className="detail-item">
                    <span className="detail-label">Annual Taxes</span>
                    <span className="detail-value">
                      {formatCurrency(property.taxes.annualAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {property.publicRecords && (
              <div className="public-records-section">
                <h3>Public Records</h3>
                <div className="details-grid">
                  {property.publicRecords.parcelNumber && (
                    <div className="detail-item">
                      <span className="detail-label">Parcel Number</span>
                      <span className="detail-value">
                        {property.publicRecords.parcelNumber}
                      </span>
                    </div>
                  )}
                  
                  {property.publicRecords.zoning && (
                    <div className="detail-item">
                      <span className="detail-label">Zoning</span>
                      <span className="detail-value">
                        {property.publicRecords.zoning}
                      </span>
                    </div>
                  )}
                  
                  {property.publicRecords.floodZone && (
                    <div className="detail-item">
                      <span className="detail-label">Flood Zone</span>
                      <span className="detail-value">
                        {property.publicRecords.floodZone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="history-tab">
            <h3>Sale History</h3>
            
            {property.saleHistory && property.saleHistory.length > 0 ? (
              <div className="sale-history-timeline">
                {property.saleHistory.map((sale, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="sale-date">{formatDate(sale.date)}</div>
                      <div className="sale-price">{formatCurrency(sale.price)}</div>
                      <div className="sale-type">{sale.transactionType}</div>
                      {sale.buyerId && (
                        <div className="sale-buyer">
                          <strong>Buyer:</strong>{' '}
                          <Link to={`/owners/${sale.buyerId}`}>
                            View Buyer
                          </Link>
                        </div>
                      )}
                      {sale.sellerId && (
                        <div className="sale-seller">
                          <strong>Seller:</strong>{' '}
                          <Link to={`/owners/${sale.sellerId}`}>
                            View Seller
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No sale history available for this property.</p>
            )}
          </div>
        )}
        
        {/* Ownership Tab */}
        {activeTab === 'ownership' && (
          <div className="ownership-tab">
            <h3>Current Ownership</h3>
            
            {property.currentOwnership && property.currentOwnership.length > 0 ? (
              <div className="ownership-list">
                {property.currentOwnership.map((ownership, index) => (
                  <div key={index} className="ownership-item">
                    <div className="owner-info">
                      <h4>
                        <Link to={`/owners/${ownership.ownerId._id}`}>
                          {ownership.ownerId.displayName}
                        </Link>
                      </h4>
                      <div className="owner-type">
                        {ownership.ownerId.type === 'individual' ? 'Individual' : 'Entity'}
                      </div>
                    </div>
                    
                    <div className="ownership-details">
                      <div className="ownership-percentage">
                        <strong>Ownership:</strong> {ownership.ownershipPercentage}%
                      </div>
                      {ownership.startDate && (
                        <div className="ownership-date">
                          <strong>Since:</strong> {formatDate(ownership.startDate)}
                        </div>
                      )}
                    </div>
                    
                    <div className="owner-actions">
                      <Link to={`/owners/${ownership.ownerId._id}`} className="btn btn-sm">
                        View Profile
                      </Link>
                      <Link to={`/wealth-analysis/${ownership.ownerId._id}`} className="btn btn-sm">
                        Wealth Analysis
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No ownership information available for this property.</p>
            )}
          </div>
        )}
        
        {/* Wealth Insights Tab */}
        {activeTab === 'wealth' && (
          <div className="wealth-tab">
            <h3>Wealth Insights</h3>
            
            {propertyInsights ? (
              <div className="wealth-insights">
                <div className="insights-summary">
                  <div className="insight-card">
                    <h4>Total Owner Net Worth</h4>
                    <div className="insight-value">
                      {formatCurrency(propertyInsights.insights.totalOwnerNetWorth)}
                    </div>
                  </div>
                  
                  <div className="insight-card">
                    <h4>Property Value to Net Worth</h4>
                    <div className="insight-value">
                      {propertyInsights.insights.propertyValueToNetWorthRatio.toFixed(1)}%
                    </div>
                    <div className="insight-description">
                      This property represents {propertyInsights.insights.propertyValueToNetWorthRatio.toFixed(1)}% of the owner's total net worth
                    </div>
                  </div>
                  
                  <div className="insight-card">
                    <h4>Wealth Comparison</h4>
                    <div className="insight-value">
                      {propertyInsights.insights.netWorthComparison > 0 ? '+' : ''}
                      {propertyInsights.insights.netWorthComparison.toFixed(0)}%
                    </div>
                    <div className="insight-description">
                      Compared to similar property owners in the area
                    </div>
                  </div>
                </div>
                
                <div className="owner-wealth-profiles">
                  <h4>Owner Wealth Profiles</h4>
                  
                  {propertyInsights.owners.map((owner, index) => (
                    <div key={index} className="owner-wealth-card">
                      <div className="owner-info">
                        <h5>
                          <Link to={`/owners/${owner.id}`}>
                            {owner.name}
                          </Link>
                        </h5>
                        <div className="ownership-percentage">
                          {owner.ownershipPercentage}% ownership
                        </div>
                      </div>
                      
                      {owner.netWorth ? (
                        <div className="owner-wealth">
                          <div className="net-worth">
                            <strong>Net Worth:</strong> {formatCurrency(owner.netWorth)}
                          </div>
                          <div className="wealth-tier">
                            <strong>Wealth Tier:</strong> {owner.wealthTier}
                          </div>
                          <div className="confidence-score">
                            <strong>Confidence:</strong> {owner.confidenceScore}%
                          </div>
                        </div>
                      ) : (
                        <div className="no-wealth-data">
                          No wealth data available
                        </div>
                      )}
                      
                      <div className="owner-actions">
                        <Link to={`/wealth-analysis/${owner.id}`} className="btn btn-sm">
                          Full Wealth Analysis
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-insights">
                <p>No wealth insights available for this property.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyDetail;