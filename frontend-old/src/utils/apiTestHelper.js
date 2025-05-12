/**
 * API Test Helper
 * Utility functions for testing API endpoints
 */

/**
 * Format API response for display and testing
 * @param {Object|string} response - API response object or string
 * @returns {string} - Formatted response for display
 */
export const formatApiResponse = (response) => {
  if (!response) {
    return 'No response received';
  }
  
  try {
    // If response is already a string, try to parse it as JSON
    if (typeof response === 'string') {
      try {
        const parsedResponse = JSON.parse(response);
        return JSON.stringify(parsedResponse, null, 2);
      } catch (e) {
        // If it's not valid JSON, return as is
        return response;
      }
    }
    
    // If response is an object, stringify it with formatting
    return JSON.stringify(response, null, 2);
  } catch (error) {
    console.error('Error formatting API response:', error);
    return `Error formatting response: ${error.message}`;
  }
};

/**
 * Test an API endpoint and handle the response
 * @param {Function} apiCall - Function that makes the API call
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export const testApiEndpoint = async (apiCall, onSuccess, onError) => {
  try {
    const response = await apiCall();
    console.log('API Response:', response);
    if (onSuccess) {
      onSuccess(formatApiResponse(response));
    }
    return response;
  } catch (error) {
    console.error('API Error:', error);
    
    // Format the error for display
    let formattedError;
    if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
      formattedError = {
        type: 'NetworkError',
        message: 'Unable to connect to the server. Please check your network connection and server status.',
        details: error.message
      };
    } else {
      formattedError = {
        type: error.name || 'Error',
        message: error.message || 'An unknown error occurred',
        details: error.stack
      };
    }
    
    if (onError) {
      onError(formatApiResponse(formattedError));
    }
    throw error;
  }
};

/**
 * Validate API response structure
 * @param {Object} response - API response to validate
 * @param {Array} requiredFields - List of required fields
 * @returns {Object} - Validation result
 */
export const validateApiResponse = (response, requiredFields = ['success']) => {
  const errors = [];
  
  // Check if response exists
  if (!response) {
    return { valid: false, errors: ['No response received'] };
  }
  
  // Check required fields
  for (const field of requiredFields) {
    if (response[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export default {
  formatApiResponse,
  testApiEndpoint,
  validateApiResponse
};