-- Check existing User table structure
-- Run this in Supabase SQL Editor to see what columns exist

-- Show table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'User' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show existing data (if any)
SELECT * FROM "User" LIMIT 5; 