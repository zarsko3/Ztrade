-- Fix Supabase RLS Security Issues
-- Run this in the Supabase SQL editor to enable RLS and create policies

-- 1. Enable Row Level Security on all tables
ALTER TABLE public.performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for the trades table
-- Policy for users to read their own trades
CREATE POLICY "Users can read their own trades"
  ON public.trades
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Policy for users to insert their own trades
CREATE POLICY "Users can insert their own trades"
  ON public.trades
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- Policy for users to update their own trades
CREATE POLICY "Users can update their own trades"
  ON public.trades
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Policy for users to delete their own trades
CREATE POLICY "Users can delete their own trades"
  ON public.trades
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- 3. Create RLS policies for the performance table
-- Policy for users to read their own performance data
CREATE POLICY "Users can read their own performance"
  ON public.performance
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Policy for users to insert their own performance data
CREATE POLICY "Users can insert their own performance"
  ON public.performance
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- Policy for users to update their own performance data
CREATE POLICY "Users can update their own performance"
  ON public.performance
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Policy for users to delete their own performance data
CREATE POLICY "Users can delete their own performance"
  ON public.performance
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- 4. Create RLS policies for the users table
-- Policy for users to read their own user data
CREATE POLICY "Users can read their own user data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid()::text);

-- Policy for users to update their own user data
CREATE POLICY "Users can update their own user data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- Policy for service role to manage all users (for admin operations)
CREATE POLICY "Service role can manage all users"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Create RLS policies for the "User" table (Prisma-generated)
-- Policy for users to read their own user data
CREATE POLICY "Users can read their own User data"
  ON public."User"
  FOR SELECT
  TO authenticated
  USING (id = auth.uid()::text);

-- Policy for users to update their own user data
CREATE POLICY "Users can update their own User data"
  ON public."User"
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- Policy for service role to manage all users (for admin operations)
CREATE POLICY "Service role can manage all User data"
  ON public."User"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. Create policies for any additional tables that might exist
-- Trade patterns table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trade_patterns') THEN
    ALTER TABLE public.trade_patterns ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can read their own trade patterns"
      ON public.trade_patterns
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid()::text);
      
    CREATE POLICY "Users can manage their own trade patterns"
      ON public.trade_patterns
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid()::text)
      WITH CHECK (user_id = auth.uid()::text);
  END IF;
END $$;

-- ML models table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ml_models') THEN
    ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can read their own ML models"
      ON public.ml_models
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid()::text);
      
    CREATE POLICY "Users can manage their own ML models"
      ON public.ml_models
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid()::text)
      WITH CHECK (user_id = auth.uid()::text);
  END IF;
END $$;

-- 7. Verify RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('trades', 'performance', 'users', 'User', 'trade_patterns', 'ml_models')
ORDER BY tablename;

-- 8. List all created policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 