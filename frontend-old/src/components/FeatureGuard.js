import React from 'react';
import PropTypes from 'prop-types';
import { isFeatureEnabled } from '../config';

/**
 * FeatureGuard Component
 * Conditionally renders children based on whether a feature is enabled
 * 
 * @param {Object} props - Component props
 * @param {string} props.feature - Feature name to check in API_FEATURES
 * @param {React.ReactNode} props.children - Children to render if feature is enabled
 * @param {React.ReactNode} props.fallback - Optional fallback to render if feature is disabled
 * @returns {React.ReactNode} - Children or fallback based on feature availability
 */
const FeatureGuard = ({ feature, children, fallback }) => {
  const isEnabled = isFeatureEnabled(feature);
  
  if (isEnabled) {
    return children;
  }
  
  if (fallback) {
    return fallback;
  }
  
  return null;
};

FeatureGuard.propTypes = {
  feature: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node
};

export default FeatureGuard;