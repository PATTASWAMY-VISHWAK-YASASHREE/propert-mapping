/**
 * Database connection module
 */

const { Pool } = require('pg');
const config = require('./config/config');

// Create a connection pool with better error handling
const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.name,
  password: config.db.password,
  port: config.db.port,
  // Add connection timeout
  connectionTimeoutMillis: 5000,
  // Add idle timeout
  idleTimeoutMillis: 30000,
  // Max clients in pool
  max: 20
});

// Add event listeners for pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

/**
 * Execute a database query with error handling
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise} - Query result
 */
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (over 100ms)
    if (duration > 100) {
      console.log('Slow query:', { text, duration, rows: result.rowCount });
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Initialize database
 * Creates necessary tables if they don't exist
 */
const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    // Begin transaction
    await client.query('BEGIN');

    // Create extension for UUID generation if it doesn't exist
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // Create companies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        website VARCHAR(255),
        industry VARCHAR(100),
        size VARCHAR(50),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'active',
        company_id UUID REFERENCES companies(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create chat_servers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_servers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create chat_channels table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_channels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        server_id UUID REFERENCES chat_servers(id) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_private BOOLEAN DEFAULT FALSE,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(server_id, name)
      )
    `);

    // Create server_roles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS server_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        server_id UUID REFERENCES chat_servers(id) NOT NULL,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(7) DEFAULT '#99AAB5',
        permissions JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(server_id, name)
      )
    `);

    // Create user_roles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id UUID REFERENCES users(id) NOT NULL,
        role_id UUID REFERENCES server_roles(id) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, role_id)
      )
    `);

    // Create channel_members table for private channels
    await client.query(`
      CREATE TABLE IF NOT EXISTS channel_members (
        channel_id UUID REFERENCES chat_channels(id) NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (channel_id, user_id)
      )
    `);

    // Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_id UUID REFERENCES chat_channels(id) NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL,
        content TEXT NOT NULL,
        parent_id UUID REFERENCES messages(id),
        is_edited BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create message_attachments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS message_attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_size INTEGER NOT NULL,
        file_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create message_reactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        emoji VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(message_id, user_id, emoji)
      )
    `);

    // Create read_receipts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS read_receipts (
        channel_id UUID REFERENCES chat_channels(id) NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL,
        last_read_message_id UUID REFERENCES messages(id),
        last_read_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (channel_id, user_id)
      )
    `);

    // Create direct_message_channels table
    await client.query(`
      CREATE TABLE IF NOT EXISTS direct_message_channels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create direct_message_participants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS direct_message_participants (
        channel_id UUID REFERENCES direct_message_channels(id) NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (channel_id, user_id)
      )
    `);

    // Create direct_messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS direct_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_id UUID REFERENCES direct_message_channels(id) NOT NULL,
        sender_id UUID REFERENCES users(id) NOT NULL,
        content TEXT NOT NULL,
        is_edited BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create user_presence table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_presence (
        user_id UUID REFERENCES users(id) PRIMARY KEY,
        status VARCHAR(50) DEFAULT 'offline',
        last_active TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id)`);

    // Commit transaction
    await client.query('COMMIT');

    console.log('Database tables initialized successfully');
    return true;
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error initializing database tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Check database health
 * @returns {Promise<boolean>} - True if database is healthy
 */
const checkHealth = async () => {
  try {
    const result = await query('SELECT 1');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

module.exports = {
  query,
  pool,
  initializeDatabase,
  checkHealth
};