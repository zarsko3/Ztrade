const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://khfzxzkpdxxsxhbmntel.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4emtwZHh4c3hoYm1udGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk1NzgyNiwiZXhwIjoyMDY5NTMzODI2fQ.bU6PXezttlbuWrdjeFzh2wmRSVTmiZ8nNJCP5qoIW3s';

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateSupabaseSchema() {
  try {
    console.log('Updating Supabase database schema...');
    
    // First, let's check if the user_id column exists
    console.log('Checking current table structure...');
    
    // Try to create the users table first
    console.log('Creating users table...');
    const { error: createUsersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (createUsersError && createUsersError.code === '42P01') {
      console.log('Users table does not exist. You need to create it manually in the Supabase dashboard.');
      console.log('Please run the following SQL in your Supabase SQL editor:');
      console.log(`
CREATE TABLE users (
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

-- Add user_id column to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add user_id column to performance table  
ALTER TABLE performance ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_user_id ON performance(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert default user
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

-- Update existing trades to belong to default user
UPDATE trades SET user_id = 'default-user-id' WHERE user_id IS NULL;

-- Update existing performance records to belong to default user
UPDATE performance SET user_id = 'default-user-id' WHERE user_id IS NULL;
      `);
    } else {
      console.log('Users table exists. Checking trades table...');
      
      // Check if user_id column exists in trades table
      const { error: tradesError } = await supabase
        .from('trades')
        .select('user_id')
        .limit(1);
      
      if (tradesError && tradesError.code === '42703') {
        console.log('user_id column does not exist in trades table.');
        console.log('Please run the following SQL in your Supabase SQL editor:');
        console.log(`
-- Add user_id column to trades table
ALTER TABLE trades ADD COLUMN user_id TEXT;

-- Add user_id column to performance table
ALTER TABLE performance ADD COLUMN user_id TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_user_id ON performance(user_id);

-- Update existing trades to belong to default user
UPDATE trades SET user_id = 'default-user-id' WHERE user_id IS NULL;

-- Update existing performance records to belong to default user
UPDATE performance SET user_id = 'default-user-id' WHERE user_id IS NULL;
        `);
      } else {
        console.log('Schema appears to be up to date!');
      }
    }
    
  } catch (error) {
    console.error('Error checking Supabase schema:', error);
  }
}

// Run the update
updateSupabaseSchema(); 