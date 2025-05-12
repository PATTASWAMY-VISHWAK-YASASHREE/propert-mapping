/**
 * Database setup script
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

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

console.log('Setting up database...');

// First, try to connect to PostgreSQL without specifying a database
const pgPool = new Pool({
  ...dbConfig,
  database: 'postgres' // Connect to default postgres database
});

// Function to create database if it doesn't exist
async function createDatabaseIfNotExists() {
  try {
    // Check if our target database exists
    const checkResult = await pgPool.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [dbConfig.database]);
    
    if (checkResult.rows.length === 0) {
      console.log(`Database '${dbConfig.database}' does not exist. Creating it now...`);
      
      // Create the database
      await pgPool.query(`CREATE DATABASE ${dbConfig.database}`);
      console.log(`Database '${dbConfig.database}' created successfully.`);
    } else {
      console.log(`Database '${dbConfig.database}' already exists.`);
    }
    
    return true;
  } catch (error) {
    console.error('Error creating database:', error);
    return false;
  } finally {
    // Close the postgres pool
    await pgPool.end();
  }
}

// Function to initialize database schema
async function initializeSchema() {
  // Create a new pool for the target database
  const pool = new Pool(dbConfig);
  
  try {
    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      console.log('Creating database schema...');
      
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
      console.log('Database schema created successfully.');
      
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating database schema:', error);
      return false;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Function to create a default company and admin user
async function createDefaultData() {
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      console.log('Creating default company and admin user...');
      
      // Check if any companies exist
      const companyCheck = await client.query('SELECT COUNT(*) FROM companies');
      
      let companyId;
      
      if (parseInt(companyCheck.rows[0].count) === 0) {
        // Create default company
        const companyResult = await client.query(`
          INSERT INTO companies (name, description)
          VALUES ('Default Company', 'Default company for testing')
          RETURNING id
        `);
        
        companyId = companyResult.rows[0].id;
        console.log(`Created default company with ID: ${companyId}`);
      } else {
        // Get first company ID
        const companyResult = await client.query('SELECT id FROM companies LIMIT 1');
        companyId = companyResult.rows[0].id;
        console.log(`Using existing company with ID: ${companyId}`);
      }
      
      // Check if any users exist
      const userCheck = await client.query('SELECT COUNT(*) FROM users');
      
      if (parseInt(userCheck.rows[0].count) === 0) {
        // Create admin user with bcrypt hash for password "admin123"
        const bcryptHash = '$2a$10$rrCvVWX9H7de.XLhxzY/aOirFkjfPzrA/oDZYUcVjwMepDqXx3Uie'; // Hash for "admin123"
        
        await client.query(`
          INSERT INTO users (first_name, last_name, email, password, role, company_id)
          VALUES ('Admin', 'User', 'admin@example.com', $1, 'admin', $2)
        `, [bcryptHash, companyId]);
        
        console.log('Created default admin user:');
        console.log('  Email: admin@example.com');
        console.log('  Password: admin123');
      } else {
        console.log('Users already exist, skipping default user creation.');
      }
      
      // Check if chat server exists for the company
      const serverCheck = await client.query('SELECT COUNT(*) FROM chat_servers WHERE company_id = $1', [companyId]);
      
      let serverId;
      
      if (parseInt(serverCheck.rows[0].count) === 0) {
        // Create chat server for the company
        const serverResult = await client.query(`
          INSERT INTO chat_servers (company_id, name, description)
          VALUES ($1, 'Main Server', 'Main chat server for the company')
          RETURNING id
        `, [companyId]);
        
        serverId = serverResult.rows[0].id;
        console.log(`Created chat server with ID: ${serverId}`);
        
        // Create default channels
        await client.query(`
          INSERT INTO chat_channels (server_id, name, description)
          VALUES 
            ($1, 'general', 'General discussion channel'),
            ($1, 'random', 'Random topics channel')
        `, [serverId]);
        
        console.log('Created default chat channels: general, random');
      } else {
        console.log('Chat server already exists for the company.');
      }
      
      await client.query('COMMIT');
      console.log('Default data created successfully.');
      
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating default data:', error);
      return false;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the setup process
async function runSetup() {
  try {
    // Step 1: Create database if it doesn't exist
    const dbCreated = await createDatabaseIfNotExists();
    if (!dbCreated) {
      console.error('Failed to create database. Setup aborted.');
      process.exit(1);
    }
    
    // Step 2: Initialize schema
    const schemaInitialized = await initializeSchema();
    if (!schemaInitialized) {
      console.error('Failed to initialize database schema. Setup aborted.');
      process.exit(1);
    }
    
    // Step 3: Create default data
    const dataCreated = await createDefaultData();
    if (!dataCreated) {
      console.error('Failed to create default data. Setup aborted.');
      process.exit(1);
    }
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('\nYou can now start the application with:');
    console.log('  npm start');
    
    process.exit(0);
  } catch (error) {
    console.error('Unexpected error during setup:', error);
    process.exit(1);
  }
}

// Run the setup
runSetup();