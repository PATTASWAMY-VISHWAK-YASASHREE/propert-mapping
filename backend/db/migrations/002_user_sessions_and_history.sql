-- Migration: Add user_sessions and browsing_history tables

-- Create user_sessions table to store session information
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create browsing_history table to store user browsing history
CREATE TABLE IF NOT EXISTS browsing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  visited_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create login_attempts table if it doesn't exist
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  ip_address VARCHAR(45),
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_browsing_history_user_id ON browsing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_browsing_history_visited_at ON browsing_history(visited_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);