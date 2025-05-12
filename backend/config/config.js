/**
 * Application configuration
 */

const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  
  // Database configuration
  db: {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'vishwak',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'property_mapping'
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file',
    expire: process.env.JWT_EXPIRE || '1h',
    cookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE || '1', 10),
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-should-be-in-env-file',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d'
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
    fromName: process.env.EMAIL_FROM_NAME
  },
  
  // File upload configuration
  fileUpload: {
    maxSize: process.env.MAX_FILE_UPLOAD || 1024 * 1024 * 5, // 5MB
    uploadPath: process.env.FILE_UPLOAD_PATH || './public/uploads'
  },
  
  // Security configuration
  security: {
    bcryptSaltRounds: 10,
    csrfProtection: process.env.CSRF_PROTECTION === 'true',
    xssProtection: true,
    noSniff: true,
    frameGuard: true
  }
};