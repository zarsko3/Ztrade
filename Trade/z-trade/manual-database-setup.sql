-- Manual Database Setup for Z-Trade
-- Run this in your Supabase SQL Editor

-- Step 1: Create User table if it doesn't exist
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT UNIQUE,
  name TEXT,
  "isActive" BOOLEAN DEFAULT true,
  role TEXT DEFAULT 'user',
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  "lastLogin" TIMESTAMP
);

-- Step 2: Create Trade table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Trade" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  "tradeType" TEXT NOT NULL CHECK ("tradeType" IN ('BUY', 'SELL')),
  quantity DECIMAL(10,4) NOT NULL,
  "entryPrice" DECIMAL(10,4) NOT NULL,
  "exitPrice" DECIMAL(10,4),
  "entryDate" TIMESTAMP NOT NULL,
  "exitDate" TIMESTAMP,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'PARTIAL')),
  "profitLoss" DECIMAL(10,4),
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now()
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS "User_username_idx" ON "User"(username);
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"(email);
CREATE INDEX IF NOT EXISTS "Trade_userId_idx" ON "Trade"("userId");
CREATE INDEX IF NOT EXISTS "Trade_ticker_idx" ON "Trade"(ticker);
CREATE INDEX IF NOT EXISTS "Trade_status_idx" ON "Trade"(status);

-- Step 4: Create zarsko user with password '123456' (bcrypt hash)
-- This hash was generated with bcrypt using 12 salt rounds
INSERT INTO "User" (username, password, email, name, "isActive", role) 
VALUES (
  'zarsko', 
  '$2a$12$rQj.8nKvnH8fYhW9.yUhS.DGYvyFzV5QnxGYvE6ZGQdCvGNqVHJhi', -- This is '123456' hashed
  'zarsko@example.com', 
  'Zarsko User', 
  true, 
  'user'
) ON CONFLICT (username) DO NOTHING;

-- Step 5: Verify the user was created
SELECT 
  id, 
  username, 
  email, 
  "isActive", 
  role, 
  "createdAt"
FROM "User" 
WHERE username = 'zarsko';

-- Step 6: Show all users (for verification)
SELECT 
  id, 
  username, 
  email, 
  "isActive", 
  role, 
  "createdAt"
FROM "User"; 