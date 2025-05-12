import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOwnerWealthProfile } from '../../store/actions/wealthActions';
import { formatCurrency, formatDate } from '../../utils/formatting';
import WealthCompositionChart from './WealthCompositionChart';
import PropertyList from '../property/PropertyList';
import './WealthProfile.css';

const WealthProfile = () => {
  const { ownerId } = useParams();
  const dispatch = useDispatch();
  const { wealthProfile, loading, error } = useSelector(state => state.wealth);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch wealth profile on component mount
  useEffect(() => {
    if (ownerId) {
      dispatch(fetchOwnerWealthProfile(ownerId));
    }
  }, [dispatch, ownerId]);
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Format confidence level as text and color
  const getConfidenceDisplay = (score) => {
    if (!score && score !== 0) return { text: 'Unknown', color: '#999' };
    
    if (score >= 90) return { text: 'Very High', color: '#2E7D32' };
    if (score >= 70) return { text: 'High', color: '#388E3C' };
    if (score >= 50) return { text: 'Medium', color: '#FFA000' };
    if (score >= 30) return { text: 'Low', color: '#F57C00' };
    return { text: 'Very Low', color: '#D32F2F' };
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="wealth-profile-loading">
        <div className="spinner"></div>
        <p>Loading wealth profile...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="wealth-profile-error">
        <h3>Error Loading Wealth Profile</h3>
        <p>{error}</p>
        <button onClick={() => dispatch(fetchOwnerWealthProfile(ownerId))}>
          Try Again
        </button>
      </div>
    );
  }
  
  // No data state
  if (!wealthProfile || !wealthProfile.owner) {
    return (
      <div className="wealth-profile-not-found">
        <h3>Wealth Profile Not Available</h3>
        <p>No wealth data could be found for this owner.</p>
        <Link to="/map" className="btn btn-primary">
          Return to Map
        </Link>
      </div>
    );
  }
  
  // Get confidence display
  const confidenceDisplay = getConfidenceDisplay(wealthProfile.metadata?.overallConfidenceScore);
  
  return (
    <div className="wealth-profile-container">
      <div className="wealth-profile-header">
        <div className="owner-info">
          <h2>{wealthProfile.owner.displayName}</h2>
          <div className="owner-type-badge">
            {wealthProfile.owner.type === 'individual' ? 'Individual' : 'Entity'}
          </div>
        </div>
        
        <div className="net-worth-display">
          <div className="net-worth-amount">
            {formatCurrency(wealthProfile.estimatedNetWorth.value)}
          </div>
          <div className="net-worth-label">Estimated Net Worth</div>
          <div 
            className="confidence-indicator"
            style={{ backgroundColor: confidenceDisplay.color }}
          >
            {confidenceDisplay.text} Confidence
          </div>
        </div>
      </div>
      
      <div className="wealth-profile-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'composition' ? 'active' : ''}`}
          onClick={() => handleTabChange('composition')}
        >
          Wealth Composition
        </button>
        <button 
          className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => handleTabChange('properties')}
        >
          Properties
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => handleTabChange('sources')}
        >
          Data Sources
        </button>
      </div>
      
      <div className="wealth-profile-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="wealth-summary">
              <div className="summary-card">
                <h4>Wealth Tier</h4>
                <div className="summary-value">{wealthProfile.wealthTier}</div>
              </div>
              
              <div className="summary-card">
                <h4>Primary Wealth Source</h4>
                <div className="summary-value">{wealthProfile.primaryWealthSource}</div>
              </div>
              
              <div className="summary-card">
                <h4>Property Holdings</h4>
                <div className="summary-value">
                  {wealthProfile.properties ? wealthProfile.properties.length : 0} Properties
                </div>
              </div>
            </div>
            
            {wealthProfile.owner.type === 'individual' && wealthProfile.owner.individual && (
              <div className="individual-details">
                <h3>Individual Details</h3>
                <div className="details-grid">
                  {wealthProfile.owner.individual.occupation && (
                    <div className="detail-item">
                      <span className="detail-label">Occupation:</span>
                      <span className="detail-value">{wealthProfile.owner.individual.occupation}</span>
                    </div>
                  )}
                  
                  {wealthProfile.owner.individual.maritalStatus && (
                    <div className="detail-item">
                      <span className="detail-label">Marital Status:</span>
                      <span className="detail-value">
                        {wealthProfile.owner.individual.maritalStatus.charAt(0).toUpperCase() + 
                         wealthProfile.owner.individual.maritalStatus.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {wealthProfile.owner.type === 'entity' && wealthProfile.owner.entity && (
              <div className="entity-details">
                <h3>Entity Details</h3>
                <div className="details-grid">
                  {wealthProfile.owner.entity.entityType && (
                    <div className="detail-item">
                      <span className="detail-label">Entity Type:</span>
                      <span className="detail-value">
                        {wealthProfile.owner.entity.entityType.toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {wealthProfile.owner.entity.incorporationDate && (
                    <div className="detail-item">
                      <span className="detail-label">Incorporation Date:</span>
                      <span className="detail-value">
                        {formatDate(wealthProfile.owner.entity.incorporationDate)}
                      </span>
                    </div>
                  )}
                  
                  {wealthProfile.owner.entity.incorporationState && (
                    <div className="detail-item">
                      <span className="detail-label">Incorporation State:</span>
                      <span className="detail-value">
                        {wealthProfile.owner.entity.incorporationState}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {wealthProfile.income && wealthProfile.income.estimatedAnnualIncome > 0 && (
              <div className="income-section">
                <h3>Income</h3>
                <div className="income-amount">
                  {formatCurrency(wealthProfile.income.estimatedAnnualIncome)} <span>estimated annual</span>
                </div>
                
                {wealthProfile.income.sources && wealthProfile.income.sources.length > 0 && (
                  <div className="income-sources">
                    <h4>Income Sources</h4>
                    <ul>
                      {wealthProfile.income.sources.map((source, index) => (
                        <li key={index}>
                          <span className="source-type">{source.type}:</span>
                          <span className="source-amount">{formatCurrency(source.amount)}</span>
                          <span className="source-percentage">({source.percentage}%)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Wealth Composition Tab */}
        {activeTab === 'composition' && (
          <div className="composition-tab">
            <div className="chart-container">
              <WealthCompositionChart composition={wealthProfile.wealthComposition} />
            </div>
            
            <div className="composition-details">
              <h3>Wealth Breakdown</h3>
              <table className="composition-table">
                <thead>
                  <tr>
                    <th>Asset Category</th>
                    <th>Value</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {wealthProfile.wealthComposition && Object.entries(wealthProfile.wealthComposition).map(([key, data]) => (
                    <tr key={key}>
                      <td>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</td>
                      <td>{formatCurrency(data.value)}</td>
                      <td>{data.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {wealthProfile.wealthComposition?.realEstate?.properties && 
             wealthProfile.wealthComposition.realEstate.properties.length > 0 && (
              <div className="real-estate-details">
                <h3>Real Estate Holdings</h3>
                <table className="properties-table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Estimated Value</th>
                      <th>Ownership %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wealthProfile.wealthComposition.realEstate.properties.map((property, index) => (
                      <tr key={index}>
                        <td>
                          <Link to={`/properties/${property.propertyId}`}>
                            View Property
                          </Link>
                        </td>
                        <td>{formatCurrency(property.estimatedValue)}</td>
                        <td>{property.ownershipPercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {wealthProfile.wealthComposition?.securities?.significantHoldings && 
             wealthProfile.wealthComposition.securities.significantHoldings.length > 0 && (
              <div className="securities-details">
                <h3>Significant Securities Holdings</h3>
                <table className="securities-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Ticker</th>
                      <th>Value</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wealthProfile.wealthComposition.securities.significantHoldings.map((holding, index) => (
                      <tr key={index}>
                        <td>{holding.name}</td>
                        <td>{holding.ticker}</td>
                        <td>{formatCurrency(holding.value)}</td>
                        <td>{holding.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div className="properties-tab">
            {wealthProfile.properties && wealthProfile.properties.length > 0 ? (
              <PropertyList properties={wealthProfile.properties} />
            ) : (
              <div className="no-properties">
                <p>No properties found for this owner.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Data Sources Tab */}
        {activeTab === 'sources' && (
          <div className="sources-tab">
            <div className="data-sources">
              <h3>Data Sources</h3>
              
              {wealthProfile.dataSources && wealthProfile.dataSources.length > 0 ? (
                <table className="sources-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Last Updated</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wealthProfile.dataSources.map((source, index) => (
                      <tr key={index}>
                        <td>{source.name}</td>
                        <td>{formatDate(source.lastUpdated)}</td>
                        <td>
                          <div 
                            className="confidence-bar"
                            style={{ 
                              width: `${source.confidenceScore}%`,
                              backgroundColor: getConfidenceDisplay(source.confidenceScore).color
                            }}
                          ></div>
                          <span>{source.confidenceScore}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No data source information available.</p>
              )}
            </div>
            
            <div className="data-disclaimer">
              <h4>Data Disclaimer</h4>
              <p>
                Wealth data is provided for informational purposes only and should not be considered
                financial advice. Estimates are based on publicly available information and proprietary
                algorithms. Actual wealth may differ significantly from these estimates.
              </p>
              <p>
                Last profile update: {formatDate(wealthProfile.metadata?.lastUpdated)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WealthProfile;