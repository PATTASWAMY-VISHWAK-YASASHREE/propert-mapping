/**
 * Response formatter utility
 * Provides consistent API response formatting
 */

/**
 * Format a successful response
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Optional success message
 * @returns {Object} - Formatted response object
 */
exports.successResponse = (data = {}, statusCode = 200, message = null) => {
  return {
    success: true,
    statusCode,
    message: message || 'Request successful',
    data
  };
};

/**
 * Format an error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} errors - Optional additional error details
 * @returns {Object} - Formatted error response object
 */
exports.errorResponse = (message = 'Server error', statusCode = 500, errors = null) => {
  return {
    success: false,
    statusCode,
    message,
    errors
  };
};

/**
 * Format a paginated response
 * @param {Array} data - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Optional success message
 * @returns {Object} - Formatted paginated response
 */
exports.paginatedResponse = (data = [], page = 1, limit = 10, total = 0, message = null) => {
  return {
    success: true,
    statusCode: 200,
    message: message || 'Request successful',
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit)
    }
  };
};

/**
 * Express middleware to ensure responses are properly formatted
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.formatResponseMiddleware = (req, res, next) => {
  // Store the original res.json method
  const originalJson = res.json;
  
  // Override res.json to ensure proper content type
  res.json = function(body) {
    // Always set content type to application/json
    res.setHeader('Content-Type', 'application/json');
    
    // Call the original json method
    return originalJson.call(this, body);
  };
  
  next();
};