-- Supabase Database Setup Script
-- Run this in your Supabase SQL Editor

-- Create users table (for Clerk user synchronization)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker VARCHAR(10) NOT NULL,
  entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  entry_price DECIMAL(10,2) NOT NULL,
  exit_date TIMESTAMP WITH TIME ZONE,
  exit_price DECIMAL(10,2),
  quantity DECIMAL(15,4) NOT NULL,
  fees DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  tags TEXT,
  is_short BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance table
CREATE TABLE IF NOT EXISTS performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_trades INTEGER NOT NULL,
  winning_trades INTEGER NOT NULL,
  losing_trades INTEGER NOT NULL,
  profit_loss DECIMAL(15,2) NOT NULL,
  sp_return DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_ticker ON trades(ticker);
CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON trades(entry_date);
CREATE INDEX IF NOT EXISTS idx_trades_exit_date ON trades(exit_date);
CREATE INDEX IF NOT EXISTS idx_performance_user_id ON performance(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_period ON performance(period);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Create RLS policies for trades table
CREATE POLICY "Users can view own trades" ON trades
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own trades" ON trades
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own trades" ON trades
  FOR DELETE USING (auth.uid()::text = user_id);

-- Create RLS policies for performance table
CREATE POLICY "Users can view own performance" ON performance
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own performance" ON performance
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own performance" ON performance
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own performance" ON performance
  FOR DELETE USING (auth.uid()::text = user_id);

-- Insert sample data (optional - for testing)
-- You can uncomment this section if you want sample data

/*
INSERT INTO users (id, username, email, first_name, last_name) VALUES
('user_30oUKghnkqoHLBXqZL8NyWcJTwC', 'testuser', 'test@example.com', 'Test', 'User');

INSERT INTO trades (user_id, ticker, entry_date, entry_price, exit_date, exit_price, quantity, fees, notes, tags, is_short) VALUES
('user_30oUKghnkqoHLBXqZL8NyWcJTwC', 'NVDA', '2025-04-25T00:00:00Z', 115.00, NULL, NULL, 8.6957, 9.99, 'AI chip leader', 'tech,ai,semiconductors', false),
('user_30oUKghnkqoHLBXqZL8NyWcJTwC', 'HOOD', '2025-05-02T00:00:00Z', 20.00, NULL, NULL, 50.0000, 9.99, 'Fintech growth play', 'fintech,brokerage', false),
('user_30oUKghnkqoHLBXqZL8NyWcJTwC', 'NU', '2025-06-05T00:00:00Z', 12.00, NULL, NULL, 83.3333, 9.99, 'Digital banking in Latin America', 'fintech,latin-america', false);
*/ 