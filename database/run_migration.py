#!/usr/bin/env python3
"""
Run a specific migration file directly
"""

import os
import sys
import psycopg2
from psycopg2.extras import register_uuid
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

def run_migration(migration_file):
    """Run a specific migration file"""
    try:
        # Connect to database
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
        
        # Read migration file
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        # Execute migration
        cursor.execute(migration_sql)
        
        # Record migration in migrations table
        cursor.execute(
            "INSERT INTO migrations (name) VALUES (%s)",
            (os.path.basename(migration_file),)
        )
        
        # Commit changes
        conn.commit()
        
        print(f"Migration {os.path.basename(migration_file)} applied successfully")
        
        # Close connection
        cursor.close()
        conn.close()
        print("Database connection closed")
        
        return True
    except psycopg2.Error as e:
        print(f"Error running migration: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_migration.py <migration_file>")
        sys.exit(1)
    
    migration_file = sys.argv[1]
    
    if not os.path.exists(migration_file):
        print(f"Migration file not found: {migration_file}")
        sys.exit(1)
    
    success = run_migration(migration_file)
    
    if not success:
        sys.exit(1)