/**
 * Object Formatter Utility for Backend
 * Provides functions to properly format and display JavaScript objects
 */

/**
 * Custom replacer function for JSON.stringify to handle circular references
 * @returns {Function} - Replacer function for JSON.stringify
 */
const circularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    return value;
  };
};

/**
 * Format any JavaScript value for display
 * @param {any} value - Value to format
 * @param {number} indent - Indentation spaces (default: 2)
 * @returns {string} - Formatted string representation
 */
const formatValue = (value, indent = 2) => {
  if (value === undefined) {
    return 'undefined';
  }
  
  if (value === null) {
    return 'null';
  }
  
  if (typeof value === 'function') {
    return value.toString();
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, circularReplacer(), indent);
    } catch (error) {
      return `[Object: ${Object.prototype.toString.call(value)}]`;
    }
  }
  
  return String(value);
};

/**
 * Safely convert any object to a string representation
 * @param {any} obj - Object to stringify
 * @returns {string} - String representation
 */
const safeStringify = (obj) => {
  if (obj === undefined) return 'undefined';
  if (obj === null) return 'null';
  
  try {
    if (typeof obj === 'object') {
      return JSON.stringify(obj, circularReplacer(), 2);
    }
    return String(obj);
  } catch (error) {
    return `[Object conversion error: ${error.message}]`;
  }
};

/**
 * Setup enhanced object formatting for the application
 * @param {boolean} enhanceToString - Whether to enhance Object.toString (use with caution)
 */
const setupObjectFormatting = (enhanceToString = false) => {
  // Only apply in non-production environments
  if (process.env.NODE_ENV === 'production') {
    console.warn('Object formatting enhancements are disabled in production');
    return;
  }
  
  // Enhance Object.toString if requested (use with caution)
  if (enhanceToString) {
    // Save the original toString method
    const originalToString = Object.prototype.toString;
    
    // Override toString for better object display
    Object.prototype.toString = function() {
      if (this === Object.prototype) {
        return originalToString.call(this);
      }
      
      try {
        return JSON.stringify(this, circularReplacer(), 2);
      } catch (e) {
        return originalToString.call(this);
      }
    };
  }
  
  // Add toString method to Error objects for better display
  if (!('toJSON' in Error.prototype)) {
    Object.defineProperty(Error.prototype, 'toJSON', {
      value: function() {
        const alt = {};
        Object.getOwnPropertyNames(this).forEach(function(key) {
          alt[key] = this[key];
        }, this);
        return alt;
      },
      configurable: true,
      writable: true
    });
  }
};

/**
 * Express middleware to ensure objects are properly formatted in responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const objectFormatterMiddleware = (req, res, next) => {
  // Store the original res.json method
  const originalJson = res.json;
  
  // Override res.json to ensure proper object formatting
  res.json = function(body) {
    // Always set content type to application/json
    res.setHeader('Content-Type', 'application/json');
    
    // If body is an object, ensure it's properly formatted
    if (typeof body === 'object' && body !== null) {
      // Handle potential circular references
      try {
        // Use the circular replacer to handle circular references
        const safeBody = JSON.parse(JSON.stringify(body, circularReplacer()));
        return originalJson.call(this, safeBody);
      } catch (error) {
        console.error('Error formatting response object:', error);
        // Fall back to original behavior
        return originalJson.call(this, body);
      }
    }
    
    // Call the original json method
    return originalJson.call(this, body);
  };
  
  next();
};

module.exports = {
  formatValue,
  safeStringify,
  setupObjectFormatting,
  objectFormatterMiddleware,
  circularReplacer
};