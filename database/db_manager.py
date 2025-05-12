#!/usr/bin/env python3
"""
PostgreSQL Database Manager for Property Mapping Platform
--------------------------------------------------------
This script provides a command-line interface for managing the PostgreSQL database
used by the Property Mapping Platform. It supports operations like:
- Creating/dropping the database
- Running migrations
- Seeding test data
- Performing CRUD operations on various tables
- Backing up and restoring data
"""

import os
import sys
import argparse
import json
import datetime
import random
import uuid
import psycopg2
from psycopg2 import sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from psycopg2.extras import register_uuid
from dotenv import load_dotenv
import faker

# Load environment variables from .env file
load_dotenv()

# Database configuration
DB_CONFIG = {
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'property_mapping')
}

# Initialize faker for generating test data
fake = faker.Faker()

class DatabaseManager:
    """Database manager for PostgreSQL operations"""
    
    def __init__(self, config=None):
        """Initialize with database configuration"""
        self.config = config or DB_CONFIG
        self.conn = None
        self.cursor = None
    
    def connect(self, database=None):
        """Connect to PostgreSQL server"""
        try:
            # Use specified database or default from config
            db_name = database or self.config['database']
            
            # Create connection
            self.conn = psycopg2.connect(
                user=self.config['user'],
                password=self.config['password'],
                host=self.config['host'],
                port=self.config['port'],
                database=db_name
            )
            
            # Register UUID type
            register_uuid()
            
            # Create cursor
            self.cursor = self.conn.cursor()
            
            print(f"Connected to database: {db_name}")
            return True
        except psycopg2.Error as e:
            if database:  # Only print error if trying to connect to a specific database
                print(f"Error connecting to database {db_name}: {e}")
            return False
    
    def connect_to_postgres(self):
        """Connect to PostgreSQL server (postgres database)"""
        try:
            # Connect to default postgres database to perform administrative tasks
            self.conn = psycopg2.connect(
                user=self.config['user'],
                password=self.config['password'],
                host=self.config['host'],
                port=self.config['port'],
                database='postgres'
            )
            self.conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            self.cursor = self.conn.cursor()
            return True
        except psycopg2.Error as e:
            print(f"Error connecting to postgres database: {e}")
            return False
    
    def close(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
            print("Database connection closed")
    
    def create_database(self):
        """Create the database"""
        if self.connect_to_postgres():
            try:
                db_name = self.config['database']
                
                # Check if database exists
                self.cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
                exists = self.cursor.fetchone()
                
                if not exists:
                    # Create database
                    self.cursor.execute(sql.SQL("CREATE DATABASE {}").format(
                        sql.Identifier(db_name)
                    ))
                    print(f"Database '{db_name}' created successfully")
                else:
                    print(f"Database '{db_name}' already exists")
                
                self.close()
                return True
            except psycopg2.Error as e:
                print(f"Error creating database: {e}")
                self.close()
                return False
        return False
    
    def drop_database(self):
        """Drop the database"""
        if self.connect_to_postgres():
            try:
                db_name = self.config['database']
                
                # Check if database exists
                self.cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
                exists = self.cursor.fetchone()
                
                if exists:
                    # Terminate all connections to the database
                    self.cursor.execute("""
                        SELECT pg_terminate_backend(pg_stat_activity.pid)
                        FROM pg_stat_activity
                        WHERE pg_stat_activity.datname = %s
                        AND pid <> pg_backend_pid()
                    """, (db_name,))
                    
                    # Drop database
                    self.cursor.execute(sql.SQL("DROP DATABASE {}").format(
                        sql.Identifier(db_name)
                    ))
                    print(f"Database '{db_name}' dropped successfully")
                else:
                    print(f"Database '{db_name}' does not exist")
                
                self.close()
                return True
            except psycopg2.Error as e:
                print(f"Error dropping database: {e}")
                self.close()
                return False
        return False
    
    def run_migrations(self):
        """Run database migrations"""
        if self.connect():
            try:
                # Create migrations table if it doesn't exist
                self.cursor.execute("""
                    CREATE TABLE IF NOT EXISTS migrations (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                self.conn.commit()
                
                # Get list of applied migrations
                self.cursor.execute("SELECT name FROM migrations")
                applied_migrations = {row[0] for row in self.cursor.fetchall()}
                
                # Get migration files
                migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
                migration_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])
                
                if not migration_files:
                    print("No migration files found")
                    self.close()
                    return True
                
                # Apply migrations
                for migration_file in migration_files:
                    if migration_file not in applied_migrations:
                        print(f"Applying migration: {migration_file}")
                        
                        # Read migration file
                        with open(os.path.join(migrations_dir, migration_file), 'r') as f:
                            migration_sql = f.read()
                        
                        # Execute migration
                        self.cursor.execute(migration_sql)
                        
                        # Record migration
                        self.cursor.execute(
                            "INSERT INTO migrations (name) VALUES (%s)",
                            (migration_file,)
                        )
                        
                        self.conn.commit()
                        print(f"Migration {migration_file} applied successfully")
                    else:
                        print(f"Migration {migration_file} already applied")
                
                print("All migrations applied successfully")
                self.close()
                return True
            except psycopg2.Error as e:
                print(f"Error running migrations: {e}")
                self.conn.rollback()
                self.close()
                return False
        return False
    
    def seed_owners(self, count=20):
        """Seed owners table with test data"""
        print(f"Seeding {count} owners...")
        
        # Check if owners table exists
        self.cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'owners'
            )
        """)
        
        if not self.cursor.fetchone()[0]:
            print("Owners table does not exist. Run migrations first.")
            return
        
        # Get company IDs
        self.cursor.execute("SELECT id FROM companies")
        company_ids = [row[0] for row in self.cursor.fetchall()]
        
        # Insert owners
        for i in range(count):
            # Generate UUID for owner
            import uuid
            owner_id = uuid.uuid4()
            
            name = fake.name()
            email = fake.email()
            phone = fake.phone_number()[:20]  # Limit to 20 characters
            address = fake.address().replace('\n', ', ')
            owner_type = random.choice(['Individual', 'Company', 'Trust', 'LLC'])
            
            # Assign a company to some owners
            company_id = random.choice(company_ids) if company_ids and random.random() > 0.5 else None
            
            self.cursor.execute("""
                INSERT INTO owners (
                    id, name, email, phone, address, owner_type, company_id, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                )
            """, (owner_id, name, email, phone, address, owner_type, company_id))
        
        self.conn.commit()
        print(f"Seeded {count} owners successfully")
    
    def seed_wealth_profiles(self, count=30):
        """Seed wealth profiles table with test data"""
        print(f"Seeding {count} wealth profiles...")
        
        # Check if wealth_profiles table exists
        self.cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'wealth_profiles'
            )
        """)
        
        if not self.cursor.fetchone()[0]:
            print("Wealth profiles table does not exist. Run migrations first.")
            return
        
        # Get owner IDs
        self.cursor.execute("SELECT id FROM owners")
        owner_ids = [row[0] for row in self.cursor.fetchall()]
        
        if not owner_ids:
            print("No owners found. Seed owners first.")
            return
        
        # Insert wealth profiles
        for i in range(min(count, len(owner_ids))):
            # Generate UUID for wealth profile
            import uuid
            profile_id = uuid.uuid4()
            
            owner_id = owner_ids[i]  # Assign one profile per owner
            estimated_net_worth = random.randint(100000, 50000000)
            income_range = random.choice(['$50k-$100k', '$100k-$250k', '$250k-$500k', '$500k+'])
            liquid_assets_range = random.choice(['$10k-$50k', '$50k-$250k', '$250k-$1M', '$1M+'])
            real_estate_holdings = random.randint(1, 10)
            source = random.choice(['WealthEngine', 'DataLabs', 'Estimated'])
            
            self.cursor.execute("""
                INSERT INTO wealth_profiles (
                    id, owner_id, estimated_net_worth, income_range, liquid_assets_range,
                    real_estate_holdings, source, last_updated, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), NOW()
                )
            """, (profile_id, owner_id, estimated_net_worth, income_range, liquid_assets_range,
                  real_estate_holdings, source))
        
        self.conn.commit()
        print(f"Seeded {min(count, len(owner_ids))} wealth profiles successfully")
    
    def seed_saved_map_views(self, count=10):
        """Seed saved map views table with test data"""
        print(f"Seeding {count} saved map views...")
        
        # Check if saved_map_views table exists
        self.cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'saved_map_views'
            )
        """)
        
        if not self.cursor.fetchone()[0]:
            print("Saved map views table does not exist. Run migrations first.")
            return
        
        # Get user IDs
        self.cursor.execute("SELECT id FROM users")
        user_ids = [row[0] for row in self.cursor.fetchall()]
        
        if not user_ids:
            print("No users found. Seed users first.")
            return
        
        # Insert saved map views
        for i in range(count):
            # Generate UUID for saved map view
            import uuid
            view_id = uuid.uuid4()
            
            user_id = random.choice(user_ids)
            name = f"Saved View {i+1}"
            center_lat = random.uniform(25.0, 49.0)
            center_lng = random.uniform(-125.0, -65.0)
            zoom = random.randint(8, 15)
            
            # Generate bounds
            bounds_ne_lat = center_lat + random.uniform(0.1, 0.5)
            bounds_ne_lng = center_lng + random.uniform(0.1, 0.5)
            bounds_sw_lat = center_lat - random.uniform(0.1, 0.5)
            bounds_sw_lng = center_lng - random.uniform(0.1, 0.5)
            
            # Generate filters as JSON
            filters = {
                "propertyType": random.choice(["Any", "Single Family", "Multi Family", "Commercial"]),
                "minValue": random.choice([0, 100000, 250000, 500000]),
                "maxValue": random.choice([1000000, 2000000, 5000000, 10000000]),
                "minYearBuilt": random.choice([0, 1950, 1980, 2000])
            }
            
            import json
            filters_json = json.dumps(filters)
            
            self.cursor.execute("""
                INSERT INTO saved_map_views (
                    id, user_id, name, center_lat, center_lng, zoom,
                    bounds_ne_lat, bounds_ne_lng, bounds_sw_lat, bounds_sw_lng,
                    filters, created_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
                )
            """, (view_id, user_id, name, center_lat, center_lng, zoom,
                  bounds_ne_lat, bounds_ne_lng, bounds_sw_lat, bounds_sw_lng,
                  filters_json))
        
        self.conn.commit()
        print(f"Seeded {count} saved map views successfully")
    
    def seed_data(self):
        """Seed database with test data"""
        if self.connect():
            try:
                # Seed users
                self.seed_users(10)
                
                # Seed companies
                self.seed_companies(20)
                
                # Seed owners
                self.seed_owners(30)
                
                # Seed properties
                self.seed_properties(50)
                
                # Seed wealth profiles
                self.seed_wealth_profiles(20)
                
                # Seed saved map views
                self.seed_saved_map_views(10)
                
                print("Database seeded successfully")
                self.close()
                return True
            except psycopg2.Error as e:
                print(f"Error seeding database: {e}")
                self.conn.rollback()
                self.close()
                return False
        return False
    
    def seed_users(self, count=10):
        """Seed users table with test data"""
        print(f"Seeding {count} users...")
        
        # Check if users table exists
        self.cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            )
        """)
        
        if not self.cursor.fetchone()[0]:
            print("Users table does not exist. Run migrations first.")
            return
        
        # Insert admin user
        admin_password = "$2a$10$OMUm5USVGFCnVPSQSOCvxOyVGQJ6HQT0c.OyVJgBzNXpuMRoQ7tIu"  # hashed 'password123'
        self.cursor.execute("""
            INSERT INTO users (
                first_name, last_name, email, password, role, status, created_at, updated_at
            ) VALUES (
                'Admin', 'User', 'admin@example.com', %s, 'admin', 'active', NOW(), NOW()
            ) ON CONFLICT (email) DO NOTHING
        """, (admin_password,))
        
        # Insert regular users
        for i in range(count):
            first_name = fake.first_name()
            last_name = fake.last_name()
            email = fake.email()
            password = "$2a$10$OMUm5USVGFCnVPSQSOCvxOyVGQJ6HQT0c.OyVJgBzNXpuMRoQ7tIu"  # hashed 'password123'
            role = random.choice(['user', 'manager'])
            status = 'active'
            
            self.cursor.execute("""
                INSERT INTO users (
                    first_name, last_name, email, password, role, status, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, NOW(), NOW()
                ) ON CONFLICT (email) DO NOTHING
            """, (first_name, last_name, email, password, role, status))
        
        self.conn.commit()
        print(f"Seeded {count} users successfully")
    
    def seed_companies(self, count=20):
        """Seed companies table with test data"""
        print(f"Seeding {count} companies...")
        
        # Check if companies table exists
        self.cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'companies'
            )
        """)
        
        if not self.cursor.fetchone()[0]:
            print("Companies table does not exist. Run migrations first.")
            return
        
        # Get user IDs
        self.cursor.execute("SELECT id FROM users")
        user_ids = [row[0] for row in self.cursor.fetchall()]
        
        if not user_ids:
            print("No users found. Seed users first.")
            return
        
        # Insert companies
        for i in range(count):
            name = fake.company()
            industry = random.choice(['Real Estate', 'Technology', 'Finance', 'Healthcare', 'Retail'])
            size = random.choice(['Small', 'Medium', 'Large', 'Enterprise'])
            website = f"https://www.{name.lower().replace(' ', '')}.com"
            description = fake.catch_phrase()
            logo_url = f"https://logo.clearbit.com/{website.replace('https://', '')}"
            
            # Generate UUID for company
            import uuid
            company_id = uuid.uuid4()
            
            self.cursor.execute("""
                INSERT INTO companies (
                    id, name, website, industry, size, description, logo_url, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                )
            """, (company_id, name, website, industry, size, description, logo_url))
        
        self.conn.commit()
        print(f"Seeded {count} companies successfully")
    
    def seed_properties(self, count=50):
        """Seed properties table with test data"""
        print(f"Seeding {count} properties...")
        
        # Check if properties table exists
        self.cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'properties'
            )
        """)
        
        if not self.cursor.fetchone()[0]:
            print("Properties table does not exist. Run migrations first.")
            return
        
        # Get owner IDs
        self.cursor.execute("SELECT id FROM owners")
        owner_ids = [row[0] for row in self.cursor.fetchall()]
        
        # If no owners exist, create some
        if not owner_ids:
            print("No owners found. Creating owners first.")
            self.seed_owners(20)
            self.cursor.execute("SELECT id FROM owners")
            owner_ids = [row[0] for row in self.cursor.fetchall()]
        
        # Insert properties
        for i in range(count):
            # Generate UUID for property
            import uuid
            property_id = uuid.uuid4()
            
            address = fake.street_address()
            city = fake.city()
            state = fake.state_abbr()
            zip_code = fake.zipcode()
            property_type = random.choice(['Single Family', 'Multi Family', 'Commercial', 'Land', 'Industrial'])
            bedrooms = random.randint(1, 6) if property_type in ['Single Family', 'Multi Family'] else None
            bathrooms = round(random.uniform(1, 4), 1) if property_type in ['Single Family', 'Multi Family'] else None
            square_feet = random.randint(800, 5000)
            lot_size = round(random.uniform(0.1, 2.0), 2)
            year_built = random.randint(1950, 2023)
            value = random.randint(100000, 5000000)
            last_sale_date = fake.date_between(start_date='-5y', end_date='today')
            last_sale_amount = int(value * random.uniform(0.8, 1.2))
            
            # Assign an owner to some properties
            owner_id = random.choice(owner_ids) if random.random() > 0.2 else None
            
            # Generate random coordinates (roughly US)
            lat = random.uniform(25.0, 49.0)
            lng = random.uniform(-125.0, -65.0)
            
            self.cursor.execute("""
                INSERT INTO properties (
                    id, address, city, state, zip, property_type, bedrooms, bathrooms,
                    square_feet, lot_size, year_built, value, last_sale_date, last_sale_amount,
                    owner_id, lat, lng, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                )
            """, (property_id, address, city, state, zip_code, property_type, bedrooms, bathrooms,
                  square_feet, lot_size, year_built, value, last_sale_date, last_sale_amount,
                  owner_id, lat, lng))
        
        self.conn.commit()
        print(f"Seeded {count} properties successfully")
    
    def backup_database(self, output_file=None):
        """Backup database to SQL file"""
        db_name = self.config['database']
        output_file = output_file or f"{db_name}_backup_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
        
        try:
            # Use pg_dump to create backup
            cmd = f"pg_dump -U {self.config['user']} -h {self.config['host']} -p {self.config['port']} -d {db_name} -f {output_file}"
            
            # Add password environment variable if provided
            env = os.environ.copy()
            if self.config['password']:
                env['PGPASSWORD'] = self.config['password']
            
            # Execute command
            import subprocess
            result = subprocess.run(cmd, shell=True, env=env, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"Database backup created successfully: {output_file}")
                return True
            else:
                print(f"Error creating database backup: {result.stderr}")
                return False
        except Exception as e:
            print(f"Error creating database backup: {e}")
            return False
    
    def restore_database(self, input_file):
        """Restore database from SQL file"""
        if not os.path.exists(input_file):
            print(f"Backup file not found: {input_file}")
            return False
        
        db_name = self.config['database']
        
        try:
            # Use psql to restore backup
            cmd = f"psql -U {self.config['user']} -h {self.config['host']} -p {self.config['port']} -d {db_name} -f {input_file}"
            
            # Add password environment variable if provided
            env = os.environ.copy()
            if self.config['password']:
                env['PGPASSWORD'] = self.config['password']
            
            # Execute command
            import subprocess
            result = subprocess.run(cmd, shell=True, env=env, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"Database restored successfully from: {input_file}")
                return True
            else:
                print(f"Error restoring database: {result.stderr}")
                return False
        except Exception as e:
            print(f"Error restoring database: {e}")
            return False
    
    def execute_query(self, query, params=None):
        """Execute a custom SQL query"""
        if self.connect():
            try:
                self.cursor.execute(query, params or ())
                
                # Check if query returns data
                if self.cursor.description:
                    columns = [desc[0] for desc in self.cursor.description]
                    results = self.cursor.fetchall()
                    
                    # Format results as list of dictionaries
                    formatted_results = []
                    for row in results:
                        formatted_results.append(dict(zip(columns, row)))
                    
                    self.conn.commit()
                    self.close()
                    return formatted_results
                else:
                    row_count = self.cursor.rowcount
                    self.conn.commit()
                    self.close()
                    return {"affected_rows": row_count}
            except psycopg2.Error as e:
                print(f"Error executing query: {e}")
                self.conn.rollback()
                self.close()
                return {"error": str(e)}
        return {"error": "Could not connect to database"}


def main():
    """Main function to handle command-line arguments"""
    parser = argparse.ArgumentParser(description='PostgreSQL Database Manager')
    
    # Main commands
    parser.add_argument('command', choices=[
        'create', 'drop', 'migrate', 'seed', 'backup', 'restore', 'query'
    ], help='Command to execute')
    
    # Optional arguments
    parser.add_argument('--file', help='File path for backup/restore operations')
    parser.add_argument('--query', help='SQL query to execute')
    parser.add_argument('--params', help='JSON string of parameters for query')
    
    args = parser.parse_args()
    
    # Create database manager
    db_manager = DatabaseManager()
    
    # Execute command
    if args.command == 'create':
        db_manager.create_database()
    elif args.command == 'drop':
        db_manager.drop_database()
    elif args.command == 'migrate':
        db_manager.run_migrations()
    elif args.command == 'seed':
        db_manager.seed_data()
    elif args.command == 'backup':
        db_manager.backup_database(args.file)
    elif args.command == 'restore':
        if not args.file:
            print("Error: --file argument is required for restore command")
            return
        db_manager.restore_database(args.file)
    elif args.command == 'query':
        if not args.query:
            print("Error: --query argument is required for query command")
            return
        
        params = None
        if args.params:
            try:
                params = json.loads(args.params)
            except json.JSONDecodeError:
                print("Error: --params must be a valid JSON string")
                return
        
        result = db_manager.execute_query(args.query, params)
        print(json.dumps(result, indent=2, default=str))


if __name__ == '__main__':
    main()