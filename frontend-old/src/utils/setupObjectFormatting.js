/**
 * Setup Object Formatting
 * Configure global object formatting to prevent [object Object] issues
 */

import { enhanceObjectToString, createObjectLogger } from './objectFormatter';

/**
 * Setup enhanced object formatting for the application
 * @param {boolean} enhanceToString - Whether to enhance Object.toString (use with caution)
 * @param {boolean} overrideConsole - Whether to override console methods
 */
const setupObjectFormatting = (enhanceToString = false, overrideConsole = true) => {
  // Only apply in non-production environments
  if (process.env.NODE_ENV === 'production') {
    console.warn('Object formatting enhancements are disabled in production');
    return;
  }
  
  // Enhance Object.toString if requested (use with caution)
  if (enhanceToString) {
    enhanceObjectToString();
  }
  
  // Override console methods to better format objects
  if (overrideConsole) {
    const objectLogger = createObjectLogger();
    
    // Save original methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    
    // Override console methods
    console.log = objectLogger.log;
    console.error = objectLogger.error;
    console.warn = objectLogger.warn;
    console.info = objectLogger.info;
    
    // Add method to restore original console
    console.restoreOriginal = () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
      delete console.restoreOriginal;
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

export default setupObjectFormatting;