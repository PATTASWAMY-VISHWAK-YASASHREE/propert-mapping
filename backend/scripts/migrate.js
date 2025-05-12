/**
 * Database migration script
 * Run with: node scripts/migrate.js
 */

const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log('Using DATABASE_URL:', databaseUrl);

// Create a connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Run database migrations
 */
const runMigrations = async () => {
  try {
    console.log('Connecting to database...');
    
    // Check connection
    await pool.query('SELECT NOW()');
    console.log(`Connected to PostgreSQL database (${process.env.NODE_ENV || 'development'} environment)`);
    
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Get list of applied migrations
    const { rows: appliedMigrations } = await pool.query('SELECT name FROM migrations');
    const appliedMigrationNames = appliedMigrations.map(m => m.name);
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../db/migrations');
    const migrationFiles = await fs.readdir(migrationsDir);
    
    // Sort migration files by name
    migrationFiles.sort();
    
    // Apply migrations that haven't been applied yet
    for (const file of migrationFiles) {
      if (file.endsWith('.sql') && !appliedMigrationNames.includes(file)) {
        console.log(`Applying migration: ${file}`);
        
        // Read migration file
        const filePath = path.join(migrationsDir, file);
        const sql = await fs.readFile(filePath, 'utf8');
        
        // Start a transaction
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          // Apply migration
          await client.query(sql);
          
          // Record migration
          await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
          
          await client.query('COMMIT');
          console.log(`Migration applied: ${file}`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`Migration failed: ${file}`, error);
          throw error;
        } finally {
          client.release();
        }
      }
    }
    
    console.log('All migrations applied successfully');
  } catch (error) {
    console.error('Migration error:', error.message);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
};

// Run migrations
runMigrations().catch(err => {
  console.error('Migration process failed:', err);
  process.exit(1);
});
