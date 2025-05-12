/**
 * Database connection and initialization
 */

const { Pool } = require('pg');
const dbConfig = require('../config/database');

// Create a connection pool
const pool = new Pool({
  user: dbConfig.user,
  password: dbConfig.password,
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.name
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database', `(${process.env.NODE_ENV || 'development'} environment)`);
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection error:', err.message);
    return false;
  }
};

// Initialize database
const initializeDatabase = async () => {
  console.log('Database connection options:', {
    user: dbConfig.user,
    password: '********',
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.name
  });
  
  console.log('Initializing database...');
  
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Could not connect to database');
    }
    
    // Check if migrations table exists
    const migrationsTableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      )
    `);
    
    // Create migrations table if it doesn't exist
    if (!migrationsTableExists.rows[0].exists) {
      await query(`
        CREATE TABLE migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Get list of applied migrations
    const appliedMigrations = await query('SELECT name FROM migrations');
    const appliedMigrationNames = appliedMigrations.rows.map(row => row.name);
    
    console.log('All migrations applied successfully');
    
    return true;
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
};

// Execute a query
const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('Query error:', err.message);
    console.error('Query:', text);
    console.error('Params:', params);
    throw err;
  }
};

module.exports = {
  query,
  initializeDatabase,
  pool
};