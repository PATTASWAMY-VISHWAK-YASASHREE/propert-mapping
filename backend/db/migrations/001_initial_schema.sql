-- Initial database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  company_id UUID,
  reset_password_token VARCHAR(100),
  reset_password_expire TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  website VARCHAR(100),
  industry VARCHAR(100),
  size VARCHAR(50),
  description TEXT,
  logo_url VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint to users table
ALTER TABLE users
ADD CONSTRAINT fk_company
FOREIGN KEY (company_id)
REFERENCES companies(id)
ON DELETE SET NULL;

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  property_type VARCHAR(50),
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  square_feet INTEGER,
  lot_size DECIMAL(10, 2),
  year_built INTEGER,
  value DECIMAL(12, 2),
  last_sale_date DATE,
  last_sale_amount DECIMAL(12, 2),
  owner_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create owners table
CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  address VARCHAR(255),
  owner_type VARCHAR(20) NOT NULL DEFAULT 'individual',
  company_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_company
    FOREIGN KEY (company_id)
    REFERENCES companies(id)
    ON DELETE SET NULL
);

-- Add foreign key constraint to properties table
ALTER TABLE properties
ADD CONSTRAINT fk_owner
FOREIGN KEY (owner_id)
REFERENCES owners(id)
ON DELETE SET NULL;

-- Create wealth_profiles table
CREATE TABLE IF NOT EXISTS wealth_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  estimated_net_worth DECIMAL(14, 2),
  income_range VARCHAR(50),
  liquid_assets_range VARCHAR(50),
  real_estate_holdings INTEGER,
  source VARCHAR(50) NOT NULL,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_owner
    FOREIGN KEY (owner_id)
    REFERENCES owners(id)
    ON DELETE CASCADE
);

-- Create saved_map_views table
CREATE TABLE IF NOT EXISTS saved_map_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(50) NOT NULL,
  center_lat DECIMAL(10, 8) NOT NULL,
  center_lng DECIMAL(11, 8) NOT NULL,
  zoom INTEGER NOT NULL,
  bounds_ne_lat DECIMAL(10, 8),
  bounds_ne_lng DECIMAL(11, 8),
  bounds_sw_lat DECIMAL(10, 8),
  bounds_sw_lng DECIMAL(11, 8),
  filters JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Create saved_searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(50) NOT NULL,
  criteria JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  parameters JSONB NOT NULL,
  result_url VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_properties_location ON properties (lat, lng);
CREATE INDEX idx_properties_owner ON properties (owner_id);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_company ON users (company_id);
CREATE INDEX idx_owners_name ON owners (name);
CREATE INDEX idx_wealth_profiles_owner ON wealth_profiles (owner_id);
CREATE INDEX idx_saved_map_views_user ON saved_map_views (user_id);
CREATE INDEX idx_saved_searches_user ON saved_searches (user_id);
CREATE INDEX idx_reports_user ON reports (user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_companies_modtime
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_properties_modtime
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_owners_modtime
BEFORE UPDATE ON owners
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_wealth_profiles_modtime
BEFORE UPDATE ON wealth_profiles
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_reports_modtime
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();