const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
console.log('Using DATABASE_URL:', databaseUrl);

// Create a connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testConnection() {
  try {
    // Test the connection
    const result = await pool.query('SELECT NOW()');
    console.log('Connection successful!');
    console.log('Current time from database:', result.rows[0].now);
    
    // Check if the database exists
    const dbResult = await pool.query(`
      SELECT datname FROM pg_database WHERE datname = 'property_mapping'
    `);
    
    if (dbResult.rows.length > 0) {
      console.log('Database "property_mapping" exists');
    } else {
      console.log('Database "property_mapping" does not exist');
    }
    
  } catch (error) {
    console.error('Connection error:', error.message);
  } finally {
    // Close the pool
    await pool.end();
  }
}

testConnection();
