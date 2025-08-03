-- Update Supabase database schema for user authentication
-- Run this in the Supabase SQL editor

-- Add user_id column to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add user_id column to performance table
ALTER TABLE performance ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add user_id column to trade_patterns table (if it exists)
ALTER TABLE trade_patterns ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add user_id column to ml_models table (if it exists)
ALTER TABLE ml_models ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT UNIQUE,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_user_id ON performance(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add foreign key constraints
ALTER TABLE trades ADD CONSTRAINT fk_trades_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE performance ADD CONSTRAINT fk_performance_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update existing records to have a default user (if any exist)
-- This creates a default user and assigns existing data to it
INSERT INTO users (id, username, password, email, name, is_active, role)
VALUES (
  'default-user-id',
  'default',
  '$2a$12$default.hash.for.existing.data',
  'default@example.com',
  'Default User',
  true,
  'user'
) ON CONFLICT (id) DO NOTHING;

-- Update existing trades to belong to the default user
UPDATE trades SET user_id = 'default-user-id' WHERE user_id IS NULL;

-- Update existing performance records to belong to the default user
UPDATE performance SET user_id = 'default-user-id' WHERE user_id IS NULL; 