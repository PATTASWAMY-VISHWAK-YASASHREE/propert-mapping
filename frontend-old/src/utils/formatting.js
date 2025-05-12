/**
 * Utility functions for formatting data
 */

// Format currency values
export const formatCurrency = (value, currency = 'USD') => {
  if (value === undefined || value === null) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value);
};

// Format date values
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

// Format date with time
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
};

// Format number with commas
export const formatNumber = (value) => {
  if (value === undefined || value === null) return 'N/A';
  
  return new Intl.NumberFormat('en-US').format(value);
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  if (value === undefined || value === null) return 'N/A';
  
  return `${value.toFixed(decimals)}%`;
};

// Format square footage
export const formatSquareFeet = (value) => {
  if (value === undefined || value === null) return 'N/A';
  
  return `${formatNumber(value)} sq ft`;
};

// Format acres
export const formatAcres = (value) => {
  if (value === undefined || value === null) return 'N/A';
  
  return `${value.toFixed(2)} acres`;
};

// Format property type
export const formatPropertyType = (type) => {
  if (!type) return 'Unknown';
  
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Format owner type
export const formatOwnerType = (type) => {
  if (!type) return 'Unknown';
  
  return type.charAt(0).toUpperCase() + type.slice(1);
};

// Format confidence level
export const formatConfidenceLevel = (score) => {
  if (score === undefined || score === null) return 'Unknown';
  
  if (score >= 90) return 'Very High';
  if (score >= 70) return 'High';
  if (score >= 50) return 'Medium';
  if (score >= 30) return 'Low';
  return 'Very Low';
};

// Format time ago
export const formatTimeAgo = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  
  return formatDate(dateString);
};