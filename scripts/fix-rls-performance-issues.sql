-- Fix Supabase RLS Performance Issues
-- Addresses auth_rls_initplan and multiple_permissive_policies warnings
-- Based on Supabase best practices from Context7 documentation

-- 1. ANALYZE CURRENT RLS POLICIES
-- Check for auth_rls_initplan issues (auth.<function>() calls without SELECT)
SELECT '=== AUTH_RLS_INITPLAN ISSUES ===' as issue_type;
SELECT 
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'performance', 'users', 'User')
  AND (
    qual LIKE '%auth.uid()%' OR 
    qual LIKE '%auth.jwt()%' OR
    with_check LIKE '%auth.uid()%' OR 
    with_check LIKE '%auth.jwt()%'
  )
  AND (
    qual NOT LIKE '%(SELECT auth.uid())%' AND
    qual NOT LIKE '%(SELECT auth.jwt())%' AND
    with_check NOT LIKE '%(SELECT auth.uid())%' AND
    with_check NOT LIKE '%(SELECT auth.jwt())%'
  );

-- Check for multiple permissive policies
SELECT '=== MULTIPLE PERMISSIVE POLICIES ===' as issue_type;
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
HAVING COUNT(*) > 1
ORDER BY tablename, roles, cmd;

-- 2. FIX AUTH_RLS_INITPLAN ISSUES
-- Optimize trades table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trades') THEN
    
    -- Drop existing policies that need optimization
    DROP POLICY IF EXISTS "Require authentication for trades" ON public.trades;
    DROP POLICY IF EXISTS "Users can read their own trades" ON public.trades;
    DROP POLICY IF EXISTS "Users can insert their own trades" ON public.trades;
    DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
    DROP POLICY IF EXISTS "Users can delete their own trades" ON public.trades;
    
    -- Create optimized consolidated policies
    CREATE POLICY "trades_authenticated_access"
      ON public.trades
      FOR ALL
      TO authenticated
      USING (user_id = (SELECT auth.uid())::text)
      WITH CHECK (user_id = (SELECT auth.uid())::text);
      
    RAISE NOTICE 'Optimized trades table policies created';
  END IF;
END $$;

-- Optimize performance table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'performance') THEN
    
    -- Drop existing policies that need optimization
    DROP POLICY IF EXISTS "Require authentication for performance" ON public.performance;
    DROP POLICY IF EXISTS "Users can read their own performance" ON public.performance;
    DROP POLICY IF EXISTS "Users can insert their own performance" ON public.performance;
    DROP POLICY IF EXISTS "Users can update their own performance" ON public.performance;
    DROP POLICY IF EXISTS "Users can delete their own performance" ON public.performance;
    
    -- Create optimized consolidated policies
    CREATE POLICY "performance_authenticated_access"
      ON public.performance
      FOR ALL
      TO authenticated
      USING (user_id = (SELECT auth.uid())::text)
      WITH CHECK (user_id = (SELECT auth.uid())::text);
      
    RAISE NOTICE 'Optimized performance table policies created';
  END IF;
END $$;

-- Optimize users table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    
    -- Drop existing policies that need optimization
    DROP POLICY IF EXISTS "Require authentication for users" ON public.users;
    DROP POLICY IF EXISTS "Users can read their own user data" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own user data" ON public.users;
    DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
    
    -- Create optimized consolidated policies
    CREATE POLICY "users_authenticated_access"
      ON public.users
      FOR ALL
      TO authenticated
      USING (id = (SELECT auth.uid())::text)
      WITH CHECK (id = (SELECT auth.uid())::text);

    CREATE POLICY "users_service_role_access"
      ON public.users
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
      
    RAISE NOTICE 'Optimized users table policies created';
  END IF;
END $$;

-- 3. ADD PERFORMANCE INDEXES
-- Add indexes for RLS performance optimization
DO $$
BEGIN
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

-- 4. VERIFICATION QUERIES
-- Check if auth_rls_initplan issues are resolved
SELECT '=== VERIFICATION: AUTH_RLS_INITPLAN FIXED ===' as verification_type;
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' 
    THEN 'OPTIMIZED'
    WHEN qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%' 
    THEN 'NEEDS_OPTIMIZATION'
    ELSE 'NO_AUTH_FUNCTIONS'
  END as optimization_status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'performance', 'users', 'User')
ORDER BY tablename, policyname;

-- Check if multiple permissive policies are consolidated
SELECT '=== VERIFICATION: PERMISSIVE POLICIES CONSOLIDATED ===' as verification_type;
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

-- 5. PERFORMANCE BENCHMARK SUGGESTIONS
SELECT '=== PERFORMANCE BENCHMARK SUGGESTIONS ===' as benchmark_type;
SELECT 
  'Run these queries to test performance:' as instruction,
  'EXPLAIN ANALYZE SELECT COUNT(*) FROM trades;' as query1,
  'EXPLAIN ANALYZE SELECT COUNT(*) FROM performance;' as query2,
  'EXPLAIN ANALYZE SELECT COUNT(*) FROM users;' as query3;
