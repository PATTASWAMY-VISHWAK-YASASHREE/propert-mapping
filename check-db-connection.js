/**
 * Database connection test script
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'vishwak',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'property_mapping',
  // Add connection timeout
  connectionTimeoutMillis: 5000
};

console.log('Attempting to connect to database with config:', {
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  port: dbConfig.port
});

// Create a connection pool
const pool = new Pool(dbConfig);

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
    console.log('\nPossible solutions:');
    console.log('1. Make sure PostgreSQL is installed and running');
    console.log('2. Check if the database exists. If not, create it with:');
    console.log(`   CREATE DATABASE ${dbConfig.database};`);
    console.log('3. Verify the database credentials in .env file');
    console.log('4. Ensure PostgreSQL is accepting connections on port', dbConfig.port);
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
    
    // Check if required tables exist
    pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `, (err, res) => {
      if (err) {
        console.error('Error checking tables:', err.stack);
      } else {
        console.log('\nDatabase tables:');
        if (res.rows.length === 0) {
          console.log('No tables found. Database schema needs to be initialized.');
        } else {
          res.rows.forEach(row => {
            console.log(`- ${row.table_name}`);
          });
        }
      }
      
      // Close the connection pool
      pool.end();
    });
  }
});