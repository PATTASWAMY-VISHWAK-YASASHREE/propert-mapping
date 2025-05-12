import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createReport } from '../../store/actions/reportActions';
import './ReportGenerator.css';

const ReportGenerator = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.reports);
  
  // Report state
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('property_list');
  const [parameters, setParameters] = useState({
    filters: {
      location: {
        city: '',
        state: '',
        zipCode: ''
      },
      propertyType: '',
      valueRange: {
        min: '',
        max: ''
      },
      sizeRange: {
        min: '',
        max: ''
      }
    },
    fields: ['address', 'propertyType', 'details', 'valuation', 'lastSale']
  });
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'reportName') {
      setReportName(value);
    } else if (name === 'reportType') {
      setReportType(value);
      
      // Reset parameters based on report type
      if (value === 'property_list') {
        setParameters({
          filters: {
            location: { city: '', state: '', zipCode: '' },
            propertyType: '',
            valueRange: { min: '', max: '' },
            sizeRange: { min: '', max: '' }
          },
          fields: ['address', 'propertyType', 'details', 'valuation', 'lastSale']
        });
      } else if (value === 'owner_wealth') {
        setParameters({
          filters: {
            type: '',
            location: { city: '', state: '' }
          },
          wealthThreshold: ''
        });
      } else if (value === 'property_valuation') {
        setParameters({
          location: { city: '', state: '', zipCode: '' },
          propertyTypes: [],
          yearRange: { min: '', max: '' }
        });
      } else if (value === 'ownership_analysis') {
        setParameters({
          location: { city: '', state: '', zipCode: '' },
          ownerTypes: [],
          minProperties: 1
        });
      }
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setParameters(prevParams => ({
        ...prevParams,
        filters: {
          ...prevParams.filters,
          [parent]: {
            ...prevParams.filters[parent],
            [child]: value
          }
        }
      }));
    } else if (name === 'wealthThreshold') {
      setParameters(prevParams => ({
        ...prevParams,
        wealthThreshold: value
      }));
    } else if (name === 'minProperties') {
      setParameters(prevParams => ({
        ...prevParams,
        minProperties: value
      }));
    } else if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setParameters(prevParams => ({
        ...prevParams,
        location: {
          ...prevParams.location,
          [field]: value
        }
      }));
    } else if (name.startsWith('valueRange.') || name.startsWith('sizeRange.') || name.startsWith('yearRange.')) {
      const [parent, child] = name.split('.');
      setParameters(prevParams => ({
        ...prevParams,
        filters: {
          ...prevParams.filters,
          [parent]: {
            ...prevParams.filters[parent],
            [child]: value
          }
        }
      }));
    } else {
      setParameters(prevParams => ({
        ...prevParams,
        filters: {
          ...prevParams.filters,
          [name]: value
        }
      }));
    }
  };
  
  // Handle checkbox changes for fields
  const handleFieldToggle = (field) => {
    setParameters(prevParams => {
      const currentFields = prevParams.fields || [];
      const newFields = currentFields.includes(field)
        ? currentFields.filter(f => f !== field)
        : [...currentFields, field];
      
      return {
        ...prevParams,
        fields: newFields
      };
    });
  };
  
  // Handle checkbox changes for property types
  const handlePropertyTypeToggle = (type) => {
    setParameters(prevParams => {
      const currentTypes = prevParams.propertyTypes || [];
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type];
      
      return {
        ...prevParams,
        propertyTypes: newTypes
      };
    });
  };
  
  // Handle checkbox changes for owner types
  const handleOwnerTypeToggle = (type) => {
    setParameters(prevParams => {
      const currentTypes = prevParams.ownerTypes || [];
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type];
      
      return {
        ...prevParams,
        ownerTypes: newTypes
      };
    });
  };
  
  // Submit report
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!reportName) {
      alert('Please enter a report name');
      return;
    }
    
    dispatch(createReport({
      name: reportName,
      type: reportType,
      parameters
    }));
  };
  
  return (
    <div className="report-generator">
      <h2>Generate Report</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="reportName">Report Name</label>
          <input
            type="text"
            id="reportName"
            name="reportName"
            value={reportName}
            onChange={handleInputChange}
            placeholder="Enter report name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="reportType">Report Type</label>
          <select
            id="reportType"
            name="reportType"
            value={reportType}
            onChange={handleInputChange}
          >
            <option value="property_list">Property List</option>
            <option value="owner_wealth">Owner Wealth Analysis</option>
            <option value="property_valuation">Property Valuation</option>
            <option value="ownership_analysis">Ownership Analysis</option>
          </select>
        </div>
        
        <div className="report-parameters">
          <h3>Report Parameters</h3>
          
          {/* Property List Report Parameters */}
          {reportType === 'property_list' && (
            <>
              <div className="parameter-section">
                <h4>Location Filters</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      name="location.city"
                      value={parameters.filters.location.city}
                      onChange={handleFilterChange}
                      placeholder="City"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="state">State</label>
                    <input
                      type="text"
                      id="state"
                      name="location.state"
                      value={parameters.filters.location.state}
                      onChange={handleFilterChange}
                      placeholder="State"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="zipCode">ZIP Code</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="location.zipCode"
                      value={parameters.filters.location.zipCode}
                      onChange={handleFilterChange}
                      placeholder="ZIP Code"
                    />
                  </div>
                </div>
              </div>
              
              <div className="parameter-section">
                <h4>Property Filters</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="propertyType">Property Type</label>
                    <select
                      id="propertyType"
                      name="propertyType"
                      value={parameters.filters.propertyType}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Types</option>
                      <option value="single_family">Single Family</option>
                      <option value="multi_family">Multi Family</option>
                      <option value="condo">Condo</option>
                      <option value="townhouse">Townhouse</option>
                      <option value="apartment">Apartment</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="land">Land</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Value Range</label>
                    <div className="range-inputs">
                      <input
                        type="number"
                        name="valueRange.min"
                        value={parameters.filters.valueRange.min}
                        onChange={handleFilterChange}
                        placeholder="Min $"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        name="valueRange.max"
                        value={parameters.filters.valueRange.max}
                        onChange={handleFilterChange}
                        placeholder="Max $"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Size Range (sqft)</label>
                    <div className="range-inputs">
                      <input
                        type="number"
                        name="sizeRange.min"
                        value={parameters.filters.sizeRange.min}
                        onChange={handleFilterChange}
                        placeholder="Min"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        name="sizeRange.max"
                        value={parameters.filters.sizeRange.max}
                        onChange={handleFilterChange}
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="parameter-section">
                <h4>Fields to Include</h4>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={parameters.fields.includes('address')}
                      onChange={() => handleFieldToggle('address')}
                    />
                    Address
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={parameters.fields.includes('propertyType')}
                      onChange={() => handleFieldToggle('propertyType')}
                    />
                    Property Type
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={parameters.fields.includes('details')}
                      onChange={() => handleFieldToggle('details')}
                    />
                    Property Details
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={parameters.fields.includes('valuation')}
                      onChange={() => handleFieldToggle('valuation')}
                    />
                    Valuation
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={parameters.fields.includes('lastSale')}
                      onChange={() => handleFieldToggle('lastSale')}
                    />
                    Last Sale
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={parameters.fields.includes('ownership')}
                      onChange={() => handleFieldToggle('ownership')}
                    />
                    Ownership
                  </label>
                </div>
              </div>
            </>
          )}
          
          {/* Owner Wealth Report Parameters */}
          {reportType === 'owner_wealth' && (
            <>
              <div className="parameter-section">
                <h4>Owner Filters</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="ownerType">Owner Type</label>
                    <select
                      id="ownerType"
                      name="type"
                      value={parameters.filters.type}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Types</option>
                      <option value="individual">Individual</option>
                      <option value="entity">Entity</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="ownerCity">City</label>
                    <input
                      type="text"
                      id="ownerCity"
                      name="location.city"
                      value={parameters.filters.location.city}
                      onChange={handleFilterChange}
                      placeholder="City"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="ownerState">State</label>
                    <input
                      type="text"
                      id="ownerState"
                      name="location.state"
                      value={parameters.filters.location.state}
                      onChange={handleFilterChange}
                      placeholder="State"
                    />
                  </div>
                </div>
              </div>
              
              <div className="parameter-section">
                <h4>Wealth Filters</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="wealthThreshold">Minimum Net Worth</label>
                    <input
                      type="number"
                      id="wealthThreshold"
                      name="wealthThreshold"
                      value={parameters.wealthThreshold}
                      onChange={handleFilterChange}
                      placeholder="Minimum Net Worth ($)"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Property Valuation Report Parameters */}
          {reportType === 'property_valuation' && (
            <>
              <div className="parameter-section">
                <h4>Location</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="valCity">City</label>
                    <input
                      type="text"
                      id="valCity"
                      name="location.city"
                      value={parameters.location.city}
                      onChange={handleFilterChange}
                      placeholder="City"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="valState">State</label>
                    <input
                      type="text"
                      id="valState"
                      name="location.state"
                      value={parameters.location.state}
                      onChange={handleFilterChange}
                      placeholder="State"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="valZipCode">ZIP Code</label>
                    <input
                      type="text"
                      id="valZipCode"
                      name="location.zipCode"
                      value={parameters.location.zipCode}
                      onChange={handleFilterChange}
                      placeholder="ZIP Code"
                    />
                  </div>
                </div>
              </div>
              
              <div className="parameter-section">
                <h4>Property Types</h4>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={parameters.propertyTypes?.includes('single_family')}
                      onChange={() => handlePropertyTypeToggle('single_family')}
                    />
                    Single Family
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={parameters.propertyTypes?.includes('multi_family')}
                      onChange={() => handlePropertyTypeToggle('multi_family')}
                    />
                    Multi Family
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={parameters.propertyTypes?.includes('condo')}
                      onChange={() => handlePropertyTypeToggle('condo')}
                    />
                    Condo
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={parameters.propertyTypes?.includes('commercial')}
                      onChange={() => handlePropertyTypeToggle('commercial')}
                    />
                    Commercial
                  </label>
                </div>
              </div>
              
              <div className="parameter-section">
                <h4>Year Built Range</h4>
                <div className="form-row">
                  <div className="form-group">
                    <div className="range-inputs">
                      <input
                        type="number"
                        name="yearRange.min"
                        value={parameters.yearRange?.min || ''}
                        onChange={handleFilterChange}
                        placeholder="Min Year"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        name="yearRange.max"
                        value={parameters.yearRange?.max || ''}
                        onChange={handleFilterChange}
                        placeholder="Max Year"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Ownership Analysis Report Parameters */}
          {reportType === 'ownership_analysis' && (
            <>
              <div className="parameter-section">
                <h4>Location</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="ownCity">City</label>
                    <input
                      type="text"
                      id="ownCity"
                      name="location.city"
                      value={parameters.location?.city || ''}
                      onChange={handleFilterChange}
                      placeholder="City"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="ownState">State</label>
                    <input
                      type="text"
                      id="ownState"
                      name="location.state"
                      value={parameters.location?.state || ''}
                      onChange={handleFilterChange}
                      placeholder="State"
                    />
                  </div>
                </div>
              </div>
              
              <div className="parameter-section">
                <h4>Owner Types</h4>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={parameters.ownerTypes?.includes('individual')}
                      onChange={() => handleOwnerTypeToggle('individual')}
                    />
                    Individual
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={parameters.ownerTypes?.includes('entity')}
                      onChange={() => handleOwnerTypeToggle('entity')}
                    />
                    Entity
                  </label>
                </div>
              </div>
              
              <div className="parameter-section">
                <h4>Minimum Properties Owned</h4>
                <div className="form-row">
                  <div className="form-group">
                    <input
                      type="number"
                      name="minProperties"
                      value={parameters.minProperties || 1}
                      onChange={handleFilterChange}
                      min="1"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="generate-btn"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportGenerator;