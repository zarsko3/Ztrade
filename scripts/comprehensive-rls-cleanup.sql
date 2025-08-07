-- Comprehensive Supabase RLS Cleanup and Optimization
-- Fixes multiple_permissive_policies warnings by removing conflicts and consolidating policies
-- Based on Supabase best practices from Context7 documentation

-- 1. ANALYZE CURRENT CONFLICTING POLICIES
SELECT '=== CURRENT CONFLICTING POLICIES ===' as analysis_type;

-- Show all policies that are causing conflicts
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
  AND tablename IN ('trades', 'performance', 'users', 'User')
  AND policyname IN (
    'Allow anonymous access to trades',
    'Allow authenticated access to trades',
    'Allow anonymous access to performance',
    'Allow authenticated access to performance',
    'Allow anonymous access to users',
    'Allow authenticated access to users'
  )
ORDER BY tablename, policyname;

-- 2. COMPREHENSIVE POLICY CLEANUP
-- Remove ALL conflicting policies first
DO $$
BEGIN
  -- Clean up trades table policies
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trades') THEN
    
    -- Drop ALL existing policies on trades table
    DROP POLICY IF EXISTS "Allow anonymous access to trades" ON public.trades;
    DROP POLICY IF EXISTS "Allow authenticated access to trades" ON public.trades;
    DROP POLICY IF EXISTS "Require authentication for trades" ON public.trades;
    DROP POLICY IF EXISTS "Users can read their own trades" ON public.trades;
    DROP POLICY IF EXISTS "Users can insert their own trades" ON public.trades;
    DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
    DROP POLICY IF EXISTS "Users can delete their own trades" ON public.trades;
    DROP POLICY IF EXISTS "trades_authenticated_access" ON public.trades;
    
    RAISE NOTICE 'Cleaned up all existing trades policies';
  END IF;
  
  -- Clean up performance table policies
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'performance') THEN
    
    -- Drop ALL existing policies on performance table
    DROP POLICY IF EXISTS "Allow anonymous access to performance" ON public.performance;
    DROP POLICY IF EXISTS "Allow authenticated access to performance" ON public.performance;
    DROP POLICY IF EXISTS "Require authentication for performance" ON public.performance;
    DROP POLICY IF EXISTS "Users can read their own performance" ON public.performance;
    DROP POLICY IF EXISTS "Users can insert their own performance" ON public.performance;
    DROP POLICY IF EXISTS "Users can update their own performance" ON public.performance;
    DROP POLICY IF EXISTS "Users can delete their own performance" ON public.performance;
    DROP POLICY IF EXISTS "performance_authenticated_access" ON public.performance;
    
    RAISE NOTICE 'Cleaned up all existing performance policies';
  END IF;
  
  -- Clean up users table policies
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    
    -- Drop ALL existing policies on users table
    DROP POLICY IF EXISTS "Allow anonymous access to users" ON public.users;
    DROP POLICY IF EXISTS "Allow authenticated access to users" ON public.users;
    DROP POLICY IF EXISTS "Require authentication for users" ON public.users;
    DROP POLICY IF EXISTS "Users can read their own user data" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own user data" ON public.users;
    DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
    DROP POLICY IF EXISTS "users_authenticated_access" ON public.users;
    DROP POLICY IF EXISTS "users_service_role_access" ON public.users;
    
    RAISE NOTICE 'Cleaned up all existing users policies';
  END IF;
END $$;

-- 3. CREATE OPTIMIZED CONSOLIDATED POLICIES
-- Trades table - Single consolidated policy for authenticated users
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trades') THEN
    
    -- Create single optimized policy for all operations
    CREATE POLICY "trades_authenticated_access"
      ON public.trades
      FOR ALL
      TO authenticated
      USING (user_id = (SELECT auth.uid())::text)
      WITH CHECK (user_id = (SELECT auth.uid())::text);
      
    RAISE NOTICE 'Created optimized trades policy';
  END IF;
END $$;

-- Performance table - Single consolidated policy for authenticated users
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'performance') THEN
    
    -- Create single optimized policy for all operations
    CREATE POLICY "performance_authenticated_access"
      ON public.performance
      FOR ALL
      TO authenticated
      USING (user_id = (SELECT auth.uid())::text)
      WITH CHECK (user_id = (SELECT auth.uid())::text);
      
    RAISE NOTICE 'Created optimized performance policy';
  END IF;
END $$;

-- Users table - Separate policies for authenticated users and service role
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    
    -- Policy for authenticated users (can only access their own data)
    CREATE POLICY "users_authenticated_access"
      ON public.users
      FOR ALL
      TO authenticated
      USING (id = (SELECT auth.uid())::text)
      WITH CHECK (id = (SELECT auth.uid())::text);

    -- Policy for service role (can access all data)
    CREATE POLICY "users_service_role_access"
      ON public.users
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
      
    RAISE NOTICE 'Created optimized users policies';
  END IF;
END $$;

-- 4. ADD PERFORMANCE INDEXES
DO $$
BEGIN
  -- Add indexes for RLS performance optimization
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trades') THEN
    CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades USING btree (user_id);
    RAISE NOTICE 'Added index on trades.user_id';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'performance') THEN
    CREATE INDEX IF NOT EXISTS idx_performance_user_id ON public.performance USING btree (user_id);
    RAISE NOTICE 'Added index on performance.user_id';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    CREATE INDEX IF NOT EXISTS idx_users_id ON public.users USING btree (id);
    RAISE NOTICE 'Added index on users.id';
  END IF;
END $$;

-- 5. VERIFICATION QUERIES
-- Check if multiple permissive policies are resolved
SELECT '=== VERIFICATION: MULTIPLE PERMISSIVE POLICIES RESOLVED ===' as verification_type;

SELECT 
  schemaname,
  tablename,
  roles,
  cmd,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'performance', 'users', 'User')
  AND permissive = 't'
GROUP BY schemaname, tablename, roles, cmd
ORDER BY tablename, roles, cmd;

-- Show final optimized policy summary
SELECT '=== FINAL OPTIMIZED POLICY SUMMARY ===' as summary_type;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid())%' THEN 'OPTIMIZED'
    WHEN qual LIKE '%auth.uid()%' THEN 'NEEDS_OPTIMIZATION'
    ELSE 'NO_AUTH_FUNCTIONS'
  END as auth_optimization,
  qual as policy_condition
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'performance', 'users', 'User')
ORDER BY tablename, policyname;

-- 6. PERFORMANCE BENCHMARK SUGGESTIONS
SELECT '=== PERFORMANCE BENCHMARK SUGGESTIONS ===' as benchmark_type;

SELECT 
  'Run these queries to test performance:' as instruction,
  'EXPLAIN ANALYZE SELECT COUNT(*) FROM trades;' as query1,
  'EXPLAIN ANALYZE SELECT COUNT(*) FROM performance;' as query2,
  'EXPLAIN ANALYZE SELECT COUNT(*) FROM users;' as query3;

-- 7. SECURITY VERIFICATION
SELECT '=== SECURITY VERIFICATION ===' as security_type;

-- Check that RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'performance', 'users', 'User')
ORDER BY tablename;

-- Check that no anonymous access is granted
SELECT 
  schemaname,
  tablename,
  policyname,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'performance', 'users', 'User')
  AND roles LIKE '%anon%'
ORDER BY tablename, policyname;
