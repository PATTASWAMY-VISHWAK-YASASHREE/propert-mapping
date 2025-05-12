-- Initial database schema for Property Mapping Platform
-- This migration creates the core tables for the application

-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    revenue BIGINT,
    employee_count INTEGER,
    website VARCHAR(255),
    address TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    property_type VARCHAR(50),
    value BIGINT,
    size INTEGER,
    year_built INTEGER,
    owner_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    location GEOGRAPHY(POINT, 4326),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Owners table (individual property owners)
CREATE TABLE IF NOT EXISTS owners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add owner_individual_id to properties
ALTER TABLE properties ADD COLUMN owner_individual_id INTEGER REFERENCES owners(id) ON DELETE SET NULL;

-- Saved map views
CREATE TABLE IF NOT EXISTS saved_map_views (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    center_lat DECIMAL(10, 8) NOT NULL,
    center_lng DECIMAL(11, 8) NOT NULL,
    zoom_level INTEGER NOT NULL,
    bounds JSON,
    filters JSON,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Saved searches
CREATE TABLE IF NOT EXISTS saved_searches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    filters JSON NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    parameters JSON NOT NULL,
    results JSON,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    scheduled BOOLEAN DEFAULT FALSE,
    schedule_frequency VARCHAR(50),
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Wealth profiles
CREATE TABLE IF NOT EXISTS wealth_profiles (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    owner_individual_id INTEGER REFERENCES owners(id) ON DELETE CASCADE,
    estimated_net_worth BIGINT,
    income_range VARCHAR(50),
    investment_profile JSON,
    property_holdings JSON,
    data_source VARCHAR(100),
    confidence_score INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT wealth_profiles_owner_check CHECK (
        (owner_id IS NOT NULL AND owner_individual_id IS NULL) OR
        (owner_id IS NULL AND owner_individual_id IS NOT NULL)
    )
);

-- Create indexes for performance
CREATE INDEX idx_properties_location ON properties USING GIST (location);
CREATE INDEX idx_properties_owner_id ON properties (owner_id);
CREATE INDEX idx_properties_owner_individual_id ON properties (owner_individual_id);
CREATE INDEX idx_properties_property_type ON properties (property_type);
CREATE INDEX idx_companies_name ON companies (name);
CREATE INDEX idx_owners_name ON owners (name);
CREATE INDEX idx_users_email ON users (email);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_owners_updated_at
BEFORE UPDATE ON owners
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_map_views_updated_at
BEFORE UPDATE ON saved_map_views
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at
BEFORE UPDATE ON saved_searches
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wealth_profiles_updated_at
BEFORE UPDATE ON wealth_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();