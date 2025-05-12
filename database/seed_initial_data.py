#!/usr/bin/env python3
"""
Initial Data Seed Script for Property Mapping Platform
-----------------------------------------------------
This script seeds the database with initial data required for the chat system.
"""

import os
import sys
import uuid
import hashlib
import psycopg2
from psycopg2.extras import register_uuid, Json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database configuration
DB_CONFIG = {
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'vishwak'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'property_mapping')
}

def connect_to_db():
    """Connect to the database"""
    try:
        # Create connection
        conn = psycopg2.connect(
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            database=DB_CONFIG['database']
        )
        
        # Register UUID type
        register_uuid()
        
        # Create cursor
        cursor = conn.cursor()
        
        print(f"Connected to database: {DB_CONFIG['database']}")
        return conn, cursor
    except psycopg2.Error as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def close_db_connection(conn, cursor):
    """Close database connection"""
    if cursor:
        cursor.close()
    if conn:
        conn.close()
        print("Database connection closed")

def hash_password(password):
    """Simple password hashing using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_tables(cursor):
    """Create necessary tables if they don't exist"""
    print("Creating tables if they don't exist...")
    
    # Create companies table
    cursor.execute("""
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
    """)
    
    # Create users table
    cursor.execute("""
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
    """)
    
    # Create chat_servers table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_servers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID REFERENCES companies(id) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    
    # Create chat_channels table
    cursor.execute("""
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
    """)
    
    # Create server_roles table
    cursor.execute("""
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
    """)
    
    # Create user_roles table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_roles (
            user_id UUID REFERENCES users(id) NOT NULL,
            role_id UUID REFERENCES server_roles(id) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY (user_id, role_id)
        )
    """)
    
    # Create channel_members table for private channels
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS channel_members (
            channel_id UUID REFERENCES chat_channels(id) NOT NULL,
            user_id UUID REFERENCES users(id) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY (channel_id, user_id)
        )
    """)
    
    # Create messages table
    cursor.execute("""
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
    """)
    
    # Create user_presence table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_presence (
            user_id UUID REFERENCES users(id) PRIMARY KEY,
            status VARCHAR(50) DEFAULT 'offline',
            last_active TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    
    print("Tables created successfully")

def seed_initial_data():
    """Seed initial data required for the chat system"""
    conn, cursor = connect_to_db()
    
    try:
        # Create tables if they don't exist
        create_tables(cursor)
        
        # Check if there are any companies
        cursor.execute("SELECT id, name FROM companies")
        companies = cursor.fetchall()
        
        company_id = None
        
        if not companies:
            print("No companies found. Creating a default company...")
            company_name = "Default Company"
            
            cursor.execute("""
                INSERT INTO companies (name, description)
                VALUES (%s, %s)
                RETURNING id, name
            """, (company_name, "Default company for testing"))
            
            company_id, company_name = cursor.fetchone()
            print(f"Created company: {company_name} (ID: {company_id})")
        else:
            company_id, company_name = companies[0]
            print(f"Using existing company: {company_name} (ID: {company_id})")
        
        # Check if there are any users
        cursor.execute("SELECT id, email, company_id FROM users")
        users = cursor.fetchall()
        
        user_id = None
        
        if not users:
            print("No users found. Creating a default admin user...")
            
            # Hash password
            password = "password123"
            hashed_password = hash_password(password)
            
            cursor.execute("""
                INSERT INTO users (first_name, last_name, email, password, role, company_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, email
            """, ("Admin", "User", "admin@example.com", hashed_password, "admin", company_id))
            
            user_id, email = cursor.fetchone()
            print(f"Created admin user: {email} (ID: {user_id})")
        else:
            # Check if users have company_id
            users_without_company = [user for user in users if user[2] is None]
            
            if users_without_company:
                print(f"Found {len(users_without_company)} users without company. Updating...")
                
                for user_id, email, _ in users_without_company:
                    cursor.execute("""
                        UPDATE users
                        SET company_id = %s
                        WHERE id = %s
                        RETURNING id, email
                    """, (company_id, user_id))
                    
                    updated_user_id, updated_email = cursor.fetchone()
                    print(f"Updated user {updated_email} (ID: {updated_user_id}) with company_id: {company_id}")
            
            user_id = users[0][0]
        
        # Check if there's a chat server for the company
        cursor.execute("SELECT id, name FROM chat_servers WHERE company_id = %s", (company_id,))
        servers = cursor.fetchall()
        
        server_id = None
        
        if not servers:
            print("No chat server found for the company. Creating...")
            
            cursor.execute("""
                INSERT INTO chat_servers (company_id, name, description)
                VALUES (%s, %s, %s)
                RETURNING id, name
            """, (company_id, f"{company_name} Chat Server", f"Company chat server for {company_name}"))
            
            server_id, server_name = cursor.fetchone()
            print(f"Created chat server: {server_name} (ID: {server_id})")
        else:
            server_id, server_name = servers[0]
            print(f"Using existing chat server: {server_name} (ID: {server_id})")
        
        # Create default channels if they don't exist
        default_channels = [
            ("general", "General discussion"),
            ("announcements", "Company announcements"),
            ("random", "Random discussions"),
            ("help", "Help and support")
        ]
        
        for channel_name, description in default_channels:
            cursor.execute("SELECT id FROM chat_channels WHERE server_id = %s AND name = %s", (server_id, channel_name))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO chat_channels (server_id, name, description, created_by)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                """, (server_id, channel_name, description, user_id))
                
                channel_id = cursor.fetchone()[0]
                print(f"Created channel: {channel_name} (ID: {channel_id})")
        
        # Create default roles if they don't exist
        default_roles = [
            ("Admin", "#FF0000", {"manage_channels": True, "manage_roles": True, "manage_messages": True, "manage_server": True}),
            ("Moderator", "#00FF00", {"manage_messages": True}),
            ("Member", "#0000FF", {})
        ]
        
        for role_name, color, permissions in default_roles:
            cursor.execute("SELECT id FROM server_roles WHERE server_id = %s AND name = %s", (server_id, role_name))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO server_roles (server_id, name, color, permissions)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                """, (server_id, role_name, color, Json(permissions)))
                
                role_id = cursor.fetchone()[0]
                print(f"Created role: {role_name} (ID: {role_id})")
        
        # Assign Admin role to the user
        cursor.execute("SELECT id FROM server_roles WHERE server_id = %s AND name = 'Admin'", (server_id,))
        admin_role_id = cursor.fetchone()[0]
        
        cursor.execute("SELECT 1 FROM user_roles WHERE user_id = %s AND role_id = %s", (user_id, admin_role_id))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO user_roles (user_id, role_id)
                VALUES (%s, %s)
                ON CONFLICT (user_id, role_id) DO NOTHING
            """, (user_id, admin_role_id))
            
            print(f"Assigned Admin role to user (ID: {user_id})")
        
        # Commit all changes
        conn.commit()
        print("Initial data seeded successfully")
        
    except Exception as e:
        conn.rollback()
        print(f"Error seeding initial data: {e}")
    finally:
        close_db_connection(conn, cursor)

if __name__ == "__main__":
    seed_initial_data()