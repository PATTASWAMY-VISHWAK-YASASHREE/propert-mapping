/**
 * Database configuration
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

module.exports = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'vishwak',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  name: process.env.DB_NAME || 'property_mapping'
};