/**
 * Database Migration Script
 * Runs the SQL migration files in the backend/db/migrations directory
 */

const fs = require('fs');
const path = require('path');
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

console.log('Running database migrations...');
console.log('Database config:', {
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  port: dbConfig.port
});

// Create a connection pool
const pool = new Pool(dbConfig);

// Path to migration files
const migrationsPath = path.join(__dirname, 'backend', 'db', 'migrations');

// Function to run a migration file
async function runMigration(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const client = await pool.connect();
  
  try {
    console.log(`Running migration: ${path.basename(filePath)}`);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`✅ Migration ${path.basename(filePath)} completed successfully`);
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Migration ${path.basename(filePath)} failed:`, error.message);
    return false;
  } finally {
    client.release();
  }
}

// Function to run all migrations
async function runMigrations() {
  try {
    // Create migrations table if it doesn't exist
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP DEFAULT NOW()
        )
      `);
    } finally {
      client.release();
    }
    
    // Get list of migration files
    const files = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations run in order
    
    // Get already applied migrations
    const result = await pool.query('SELECT name FROM migrations');
    const appliedMigrations = result.rows.map(row => row.name);
    
    // Run migrations that haven't been applied yet
    let success = true;
    for (const file of files) {
      if (!appliedMigrations.includes(file)) {
        const filePath = path.join(migrationsPath, file);
        const migrationSuccess = await runMigration(filePath);
        
        if (migrationSuccess) {
          // Record successful migration
          await pool.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [file]
          );
        } else {
          success = false;
          break;
        }
      } else {
        console.log(`Migration ${file} already applied, skipping`);
      }
    }
    
    if (success) {
      console.log('\n✅ All migrations completed successfully');
    } else {
      console.error('\n❌ Some migrations failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations();