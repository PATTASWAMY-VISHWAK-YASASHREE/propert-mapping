/**
 * Object Formatter Utility
 * Provides functions to properly format and display JavaScript objects
 */

/**
 * Custom replacer function for JSON.stringify to handle circular references
 * @returns {Function} - Replacer function for JSON.stringify
 */
export const circularReplacer = () => {
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
export const formatValue = (value, indent = 2) => {
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
export const safeStringify = (obj) => {
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
 * Override the default toString method of Object.prototype to provide better output
 * WARNING: This affects all objects in the application!
 * Only use this in development/testing environments
 */
export const enhanceObjectToString = () => {
  if (process.env.NODE_ENV !== 'production') {
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
    
    console.log('Enhanced Object.toString() for better debugging output');
  }
};

/**
 * Create a custom logger that properly formats objects
 * @returns {Object} - Custom logger object
 */
export const createObjectLogger = () => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  
  return {
    log: (...args) => {
      const formattedArgs = args.map(arg => 
        typeof arg === 'object' && arg !== null ? safeStringify(arg) : arg
      );
      originalConsoleLog(...formattedArgs);
    },
    
    error: (...args) => {
      const formattedArgs = args.map(arg => 
        typeof arg === 'object' && arg !== null ? safeStringify(arg) : arg
      );
      originalConsoleError(...formattedArgs);
    },
    
    warn: (...args) => {
      const formattedArgs = args.map(arg => 
        typeof arg === 'object' && arg !== null ? safeStringify(arg) : arg
      );
      originalConsoleWarn(...formattedArgs);
    },
    
    info: (...args) => {
      const formattedArgs = args.map(arg => 
        typeof arg === 'object' && arg !== null ? safeStringify(arg) : arg
      );
      originalConsoleInfo(...formattedArgs);
    }
  };
};

export default {
  formatValue,
  safeStringify,
  enhanceObjectToString,
  createObjectLogger,
  circularReplacer
};