/**
 * Main server file
 */

const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const errorHandler = require('./middleware/error');
const config = require('./config/config');
const db = require('./db');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Body parser with enhanced object handling
app.use(express.json({
  limit: '10mb',
  reviver: (key, value) => {
    // Handle special cases if needed
    return value;
  }
}));

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Security middleware
app.use(helmet()); // Set security headers
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP param pollution
app.use(compression()); // Compress responses

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max
});
app.use('/api', limiter);

// Enable CORS
// Enhanced CORS configuration

// Enhanced CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Handle preflight requests
app.options('*', cors());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: config.env,
    timestamp: new Date().toISOString()
  });
});

// Initialize database
db.initializeDatabase().then(() => {
  console.log('Database initialized successfully');
  
  // Mount routers - only mount after database is initialized
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/companies', require('./routes/companies'));
  app.use('/api/properties', require('./routes/properties'));
  app.use('/api/map', require('./routes/map'));
  app.use('/api/reports', require('./routes/reports'));
  app.use('/api/wealth', require('./routes/wealth'));
  app.use('/api/chat', require('./routes/chat'));
  app.use('/api/health', require('./routes/health'));

  // API documentation
  if (config.env === 'development') {
    app.use('/docs/api', express.static(path.join(__dirname, 'docs')));
  }

  // Handle 404 routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`
      });
    }
    
    // For non-API routes, serve the React app
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // Object formatter middleware to prevent [object Object] issues
  const { objectFormatterMiddleware } = require('./utils/objectFormatter');
  app.use(objectFormatterMiddleware);
  
  // Error handler middleware
  app.use(errorHandler);

  // Set port
  const PORT = config.port;

  // Start server
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${config.env} mode on port ${PORT}`.yellow.bold);
  });
  
  // Initialize WebSocket server
  const { initializeSocketServer } = require('./socket');
  const io = initializeSocketServer(server);
  
  // Make io available to routes
  app.set('io', io);

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red);
    // Close server & exit process
    server.close(() => process.exit(1));
  });

}).catch(err => {
  console.error('Database initialization failed:', err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`.red);
  process.exit(1);
});