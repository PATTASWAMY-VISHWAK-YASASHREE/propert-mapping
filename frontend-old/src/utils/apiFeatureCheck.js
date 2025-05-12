/**
 * API Feature Check Utility
 * Checks if required API keys/configurations are available in .env
 * and provides utilities to gracefully handle missing APIs
 */

/**
 * Check if an API key or configuration exists in environment variables
 * @param {string} apiKey - The environment variable name to check
 * @returns {boolean} - Whether the API key exists and is not empty
 */
export const isApiAvailable = (apiKey) => {
  const value = process.env[apiKey];
  return value !== undefined && value !== null && value !== '';
};

/**
 * Execute a function only if the required API is available
 * @param {string} apiKey - The environment variable name to check
 * @param {Function} fn - Function to execute if API is available
 * @param {Function} fallbackFn - Optional fallback function to execute if API is not available
 * @returns {Function} - A wrapped function that checks API availability before execution
 */
export const withApi = (apiKey, fn, fallbackFn = null) => {
  return (...args) => {
    if (isApiAvailable(apiKey)) {
      return fn(...args);
    } else {
      console.warn(`API key "${apiKey}" is not available in environment variables. Feature disabled.`);
      return fallbackFn ? fallbackFn(...args) : null;
    }
  };
};

/**
 * Create a component that renders only if the required API is available
 * @param {string} apiKey - The environment variable name to check
 * @param {React.Component} Component - Component to render if API is available
 * @param {React.Component} FallbackComponent - Optional component to render if API is not available
 * @returns {React.Component} - A component that conditionally renders based on API availability
 */
export const withApiComponent = (apiKey, Component, FallbackComponent = null) => {
  return (props) => {
    if (isApiAvailable(apiKey)) {
      return <Component {...props} />;
    } else {
      return FallbackComponent ? <FallbackComponent {...props} /> : null;
    }
  };
};

/**
 * Check multiple API keys and return which ones are available
 * @param {string[]} apiKeys - Array of API keys to check
 * @returns {Object} - Object with API keys as keys and availability as values
 */
export const checkApisAvailability = (apiKeys) => {
  const result = {};
  
  apiKeys.forEach(key => {
    result[key] = isApiAvailable(key);
  });
  
  return result;
};

/**
 * Execute a function with graceful degradation based on available APIs
 * @param {Object} apiConfigs - Object mapping feature names to required API keys and functions
 * @returns {Object} - Object with the same keys but functions wrapped with API checks
 * 
 * @example
 * const features = withApiFeatures({
 *   faceSwap: { 
 *     apiKey: 'REACT_APP_FACE_API_KEY', 
 *     fn: performFaceSwap,
 *     fallback: showFaceSwapUnavailable
 *   },
 *   translation: { 
 *     apiKey: 'REACT_APP_TRANSLATION_API_KEY', 
 *     fn: translateText 
 *   }
 * });
 * 
 * // Later use:
 * features.faceSwap(image1, image2); // Only executes if REACT_APP_FACE_API_KEY exists
 */
export const withApiFeatures = (apiConfigs) => {
  const wrappedFeatures = {};
  
  Object.entries(apiConfigs).forEach(([featureName, config]) => {
    wrappedFeatures[featureName] = withApi(
      config.apiKey,
      config.fn,
      config.fallback || null
    );
  });
  
  return wrappedFeatures;
};

/**
 * Get a list of all available and missing API features
 * @param {Object} requiredApis - Object mapping feature names to required API keys
 * @returns {Object} - Object with available and unavailable features
 * 
 * @example
 * const apiStatus = getApiStatus({
 *   faceSwap: 'REACT_APP_FACE_API_KEY',
 *   translation: 'REACT_APP_TRANSLATION_API_KEY',
 *   maps: 'REACT_APP_MAPS_API_KEY'
 * });
 * 
 * // Result:
 * // {
 * //   available: ['faceSwap', 'maps'],
 * //   unavailable: ['translation']
 * // }
 */
export const getApiStatus = (requiredApis) => {
  const available = [];
  const unavailable = [];
  
  Object.entries(requiredApis).forEach(([feature, apiKey]) => {
    if (isApiAvailable(apiKey)) {
      available.push(feature);
    } else {
      unavailable.push(feature);
    }
  });
  
  return { available, unavailable };
};

export default {
  isApiAvailable,
  withApi,
  withApiComponent,
  checkApisAvailability,
  withApiFeatures,
  getApiStatus
};