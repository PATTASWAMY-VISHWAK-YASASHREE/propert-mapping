import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setMapFilters } from '../../store/actions/mapActions';
import { fetchSavedSearches, saveSearch } from '../../store/actions/searchActions';
import './MapFilters.css';

const MapFilters = ({ onFilterChange }) => {
  const dispatch = useDispatch();
  const { filters, savedSearches } = useSelector(state => ({
    filters: state.map.filters,
    savedSearches: state.search.savedSearches
  }));
  
  // Local state for filter values
  const [propertyType, setPropertyType] = useState(filters.propertyType || '');
  const [minValue, setMinValue] = useState(filters.minValue || '');
  const [maxValue, setMaxValue] = useState(filters.maxValue || '');
  const [minSize, setMinSize] = useState(filters.minSize || '');
  const [maxSize, setMaxSize] = useState(filters.maxSize || '');
  const [ownerWealthMin, setOwnerWealthMin] = useState(filters.ownerWealthMin || '');
  const [ownerWealthMax, setOwnerWealthMax] = useState(filters.ownerWealthMax || '');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [showSaveSearchInput, setShowSaveSearchInput] = useState(false);
  
  // Load saved searches on component mount
  useEffect(() => {
    dispatch(fetchSavedSearches());
  }, [dispatch]);
  
  // Apply filters
  const applyFilters = () => {
    const newFilters = {
      propertyType: propertyType || undefined,
      minValue: minValue || undefined,
      maxValue: maxValue || undefined,
      minSize: minSize || undefined,
      maxSize: maxSize || undefined,
      ownerWealthMin: ownerWealthMin || undefined,
      ownerWealthMax: ownerWealthMax || undefined
    };
    
    // Remove undefined values
    Object.keys(newFilters).forEach(key => 
      newFilters[key] === undefined && delete newFilters[key]
    );
    
    // Update Redux store
    dispatch(setMapFilters(newFilters));
    
    // Notify parent component
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setPropertyType('');
    setMinValue('');
    setMaxValue('');
    setMinSize('');
    setMaxSize('');
    setOwnerWealthMin('');
    setOwnerWealthMax('');
    
    const emptyFilters = {};
    
    // Update Redux store
    dispatch(setMapFilters(emptyFilters));
    
    // Notify parent component
    if (onFilterChange) {
      onFilterChange(emptyFilters);
    }
  };
  
  // Handle saved search selection
  const handleSavedSearchSelect = (searchId) => {
    const selectedSearch = savedSearches.find(search => search._id === searchId);
    
    if (selectedSearch && selectedSearch.filters) {
      const { filters } = selectedSearch;
      
      // Update local state
      setPropertyType(filters.propertyType || '');
      setMinValue(filters.minValue || '');
      setMaxValue(filters.maxValue || '');
      setMinSize(filters.minSize || '');
      setMaxSize(filters.maxSize || '');
      setOwnerWealthMin(filters.ownerWealthMin || '');
      setOwnerWealthMax(filters.ownerWealthMax || '');
      
      // Show advanced filters if any are set
      if (filters.minSize || filters.maxSize || filters.ownerWealthMin || filters.ownerWealthMax) {
        setShowAdvancedFilters(true);
      }
      
      // Apply filters
      dispatch(setMapFilters(filters));
      
      // Notify parent component
      if (onFilterChange) {
        onFilterChange(filters);
      }
    }
  };
  
  // Save current search
  const saveCurrentSearch = () => {
    if (!searchName.trim()) return;
    
    const currentFilters = {
      propertyType: propertyType || undefined,
      minValue: minValue || undefined,
      maxValue: maxValue || undefined,
      minSize: minSize || undefined,
      maxSize: maxSize || undefined,
      ownerWealthMin: ownerWealthMin || undefined,
      ownerWealthMax: ownerWealthMax || undefined
    };
    
    // Remove undefined values
    Object.keys(currentFilters).forEach(key => 
      currentFilters[key] === undefined && delete currentFilters[key]
    );
    
    dispatch(saveSearch({
      name: searchName,
      filters: currentFilters
    }));
    
    // Reset save search UI
    setSearchName('');
    setShowSaveSearchInput(false);
  };
  
  return (
    <div className="map-filters">
      <div className="filter-header">
        <h3>Property Filters</h3>
        <div className="saved-search-controls">
          <select 
            onChange={(e) => handleSavedSearchSelect(e.target.value)}
            value=""
            className="saved-search-select"
          >
            <option value="">Saved Searches</option>
            {savedSearches.map(search => (
              <option key={search._id} value={search._id}>
                {search.name}
              </option>
            ))}
          </select>
          
          <button 
            className="save-search-btn"
            onClick={() => setShowSaveSearchInput(!showSaveSearchInput)}
          >
            <i className="fa fa-save"></i>
          </button>
        </div>
      </div>
      
      {showSaveSearchInput && (
        <div className="save-search-input">
          <input
            type="text"
            placeholder="Search name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <button onClick={saveCurrentSearch}>Save</button>
        </div>
      )}
      
      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="propertyType">Property Type</label>
          <select
            id="propertyType"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
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
        
        <div className="filter-group">
          <label>Property Value</label>
          <div className="range-inputs">
            <input
              type="number"
              placeholder="Min $"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
            />
            <span>to</span>
            <input
              type="number"
              placeholder="Max $"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="advanced-filters-toggle">
        <button 
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="toggle-btn"
        >
          {showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          <i className={`fa fa-chevron-${showAdvancedFilters ? 'up' : 'down'}`}></i>
        </button>
      </div>
      
      {showAdvancedFilters && (
        <div className="advanced-filters">
          <div className="filter-group">
            <label>Property Size (sqft)</label>
            <div className="range-inputs">
              <input
                type="number"
                placeholder="Min"
                value={minSize}
                onChange={(e) => setMinSize(e.target.value)}
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max"
                value={maxSize}
                onChange={(e) => setMaxSize(e.target.value)}
              />
            </div>
          </div>
          
          <div className="filter-group">
            <label>Owner Net Worth</label>
            <div className="range-inputs">
              <input
                type="number"
                placeholder="Min $"
                value={ownerWealthMin}
                onChange={(e) => setOwnerWealthMin(e.target.value)}
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max $"
                value={ownerWealthMax}
                onChange={(e) => setOwnerWealthMax(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="filter-actions">
        <button 
          className="apply-filters-btn"
          onClick={applyFilters}
        >
          Apply Filters
        </button>
        
        <button 
          className="reset-filters-btn"
          onClick={resetFilters}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default MapFilters;