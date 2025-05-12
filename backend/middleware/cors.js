/**
 * CORS middleware configuration
 */

const cors = require('cors');

/**
 * Configure CORS options for Express application
 * @param {Object} config - Configuration object
 * @returns {Function} - Configured CORS middleware
 */
const configureCors = (config) => {
  const corsOptions = {
    // Allow requests from frontend origin in development and production
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);
      
      // Define allowed origins
      const allowedOrigins = [
        // Local development
        'http://localhost:3000',
        'http://localhost:5000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5000',
        // Production origin - replace with your actual domain
        'https://yourproductiondomain.com'
      ];
      
      // Check if the origin is allowed
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    // Allow credentials (cookies, authorization headers)
    credentials: true,
    // Allow these methods
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    // Allow these headers
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    // Expose these headers to the browser
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
    // Pre-flight requests are cached for 1 hour
    maxAge: 3600
  };
  
  return cors(corsOptions);
};

module.exports = configureCors;