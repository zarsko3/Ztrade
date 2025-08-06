-- Optimize Supabase RLS Policies for Performance
-- Fixes auth_rls_initplan and multiple_permissive_policies warnings

-- 1. Optimize trades table policies (fix auth_rls_initplan)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trades') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can read their own trades" ON public.trades;
    DROP POLICY IF EXISTS "Users can insert their own trades" ON public.trades;
    DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
    DROP POLICY IF EXISTS "Users can delete their own trades" ON public.trades;
    
    -- Create optimized policies with scalar subqueries
    CREATE POLICY "Users can read their own trades"
      ON public.trades
      FOR SELECT
      TO authenticated
      USING (user_id = (SELECT auth.uid())::text);

    CREATE POLICY "Users can insert their own trades"
      ON public.trades
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = (SELECT auth.uid())::text);

    CREATE POLICY "Users can update their own trades"
      ON public.trades
      FOR UPDATE
      TO authenticated
      USING (user_id = (SELECT auth.uid())::text)
      WITH CHECK (user_id = (SELECT auth.uid())::text);

    CREATE POLICY "Users can delete their own trades"
      ON public.trades
      FOR DELETE
      TO authenticated
      USING (user_id = (SELECT auth.uid())::text);
      
    RAISE NOTICE 'Optimized policies created for trades table';
  END IF;
END $$;

-- 2. Optimize performance table policies (fix auth_rls_initplan)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'performance') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can read their own performance" ON public.performance;
    DROP POLICY IF EXISTS "Users can insert their own performance" ON public.performance;
    DROP POLICY IF EXISTS "Users can update their own performance" ON public.performance;
    DROP POLICY IF EXISTS "Users can delete their own performance" ON public.performance;
    
    -- Create optimized policies with scalar subqueries
    CREATE POLICY "Users can read their own performance"
      ON public.performance
      FOR SELECT
      TO authenticated
      USING (user_id = (SELECT auth.uid())::text);

    CREATE POLICY "Users can insert their own performance"
      ON public.performance
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = (SELECT auth.uid())::text);

    CREATE POLICY "Users can update their own performance"
      ON public.performance
      FOR UPDATE
      TO authenticated
      USING (user_id = (SELECT auth.uid())::text)
      WITH CHECK (user_id = (SELECT auth.uid())::text);

    CREATE POLICY "Users can delete their own performance"
      ON public.performance
      FOR DELETE
      TO authenticated
      USING (user_id = (SELECT auth.uid())::text);
      
    RAISE NOTICE 'Optimized policies created for performance table';
  END IF;
END $$;

-- 3. Optimize users table policies (fix auth_rls_initplan)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can read their own user data" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own user data" ON public.users;
    DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
    
    -- Create optimized policies with scalar subqueries
    CREATE POLICY "Users can read their own user data"
      ON public.users
      FOR SELECT
      TO authenticated
      USING (id = (SELECT auth.uid())::text);

    CREATE POLICY "Users can update their own user data"
      ON public.users
      FOR UPDATE
      TO authenticated
      USING (id = (SELECT auth.uid())::text)
      WITH CHECK (id = (SELECT auth.uid())::text);

    CREATE POLICY "Service role can manage all users"
      ON public.users
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
      
    RAISE NOTICE 'Optimized policies created for users table';
  END IF;
END $$;

-- 4. Optimize "User" table policies (fix auth_rls_initplan)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can read their own User data" ON public."User";
    DROP POLICY IF EXISTS "Users can update their own User data" ON public."User";
    DROP POLICY IF EXISTS "Service role can manage all User data" ON public."User";
    
    -- Create optimized policies with scalar subqueries
    CREATE POLICY "Users can read their own User data"
      ON public."User"
      FOR SELECT
      TO authenticated
      USING (id = (SELECT auth.uid())::text);

    CREATE POLICY "Users can update their own User data"
      ON public."User"
      FOR UPDATE
      TO authenticated
      USING (id = (SELECT auth.uid())::text)
      WITH CHECK (id = (SELECT auth.uid())::text);

    CREATE POLICY "Service role can manage all User data"
      ON public."User"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
      
    RAISE NOTICE 'Optimized policies created for User table';
  END IF;
END $$;

-- 5. Check for and consolidate multiple permissive policies
-- First, let's see what permissive policies exist
SELECT 'Current Permissive Policies' as check_type;
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  roles, 
  cmd,
  permissive
FROM pg_policies 
WHERE permissive = 't' 
  AND schemaname = 'public'
  AND tablename IN ('trades', 'performance', 'users', 'User')
ORDER BY tablename, roles, cmd;

-- 6. Performance verification queries
SELECT 'Performance Check - RLS Status' as check_type;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('trades', 'performance', 'users', 'User')
ORDER BY tablename;

SELECT 'Performance Check - Policy Count' as check_type;
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count,
  COUNT(CASE WHEN permissive = 't' THEN 1 END) as permissive_count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'performance', 'users', 'User')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- 7. Show optimized policy details
SELECT 'Optimized Policy Details' as check_type;
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
ORDER BY tablename, policyname; 