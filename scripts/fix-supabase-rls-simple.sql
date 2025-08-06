-- Fix Supabase RLS Security Issues (Simplified Version)
-- Run this in the Supabase SQL editor to enable RLS and create policies

-- 1. Enable Row Level Security on core tables (only if they exist)
DO $$
BEGIN
  -- Enable RLS on trades table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trades') THEN
    ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on trades table';
  END IF;
  
  -- Enable RLS on performance table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'performance') THEN
    ALTER TABLE public.performance ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on performance table';
  END IF;
  
  -- Enable RLS on users table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on users table';
  END IF;
  
  -- Enable RLS on "User" table (Prisma-generated)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
    ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on User table';
  END IF;
END $$;

-- 2. Create RLS policies for trades table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trades') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can read their own trades" ON public.trades;
    DROP POLICY IF EXISTS "Users can insert their own trades" ON public.trades;
    DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
    DROP POLICY IF EXISTS "Users can delete their own trades" ON public.trades;
    
    -- Create new policies
    CREATE POLICY "Users can read their own trades"
      ON public.trades
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid()::text);

    CREATE POLICY "Users can insert their own trades"
      ON public.trades
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid()::text);

    CREATE POLICY "Users can update their own trades"
      ON public.trades
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid()::text)
      WITH CHECK (user_id = auth.uid()::text);

    CREATE POLICY "Users can delete their own trades"
      ON public.trades
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid()::text);
      
    RAISE NOTICE 'Policies created for trades table';
  END IF;
END $$;

-- 3. Create RLS policies for performance table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'performance') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can read their own performance" ON public.performance;
    DROP POLICY IF EXISTS "Users can insert their own performance" ON public.performance;
    DROP POLICY IF EXISTS "Users can update their own performance" ON public.performance;
    DROP POLICY IF EXISTS "Users can delete their own performance" ON public.performance;
    
    -- Create new policies
    CREATE POLICY "Users can read their own performance"
      ON public.performance
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid()::text);

    CREATE POLICY "Users can insert their own performance"
      ON public.performance
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid()::text);

    CREATE POLICY "Users can update their own performance"
      ON public.performance
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid()::text)
      WITH CHECK (user_id = auth.uid()::text);

    CREATE POLICY "Users can delete their own performance"
      ON public.performance
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid()::text);
      
    RAISE NOTICE 'Policies created for performance table';
  END IF;
END $$;

-- 4. Create RLS policies for users table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can read their own user data" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own user data" ON public.users;
    DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
    
    -- Create new policies
    CREATE POLICY "Users can read their own user data"
      ON public.users
      FOR SELECT
      TO authenticated
      USING (id = auth.uid()::text);

    CREATE POLICY "Users can update their own user data"
      ON public.users
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid()::text)
      WITH CHECK (id = auth.uid()::text);

    CREATE POLICY "Service role can manage all users"
      ON public.users
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
      
    RAISE NOTICE 'Policies created for users table';
  END IF;
END $$;

-- 5. Create RLS policies for "User" table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can read their own User data" ON public."User";
    DROP POLICY IF EXISTS "Users can update their own User data" ON public."User";
    DROP POLICY IF EXISTS "Service role can manage all User data" ON public."User";
    
    -- Create new policies
    CREATE POLICY "Users can read their own User data"
      ON public."User"
      FOR SELECT
      TO authenticated
      USING (id = auth.uid()::text);

    CREATE POLICY "Users can update their own User data"
      ON public."User"
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid()::text)
      WITH CHECK (id = auth.uid()::text);

    CREATE POLICY "Service role can manage all User data"
      ON public."User"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
      
    RAISE NOTICE 'Policies created for User table';
  END IF;
END $$;

-- 6. Verification queries
SELECT 'RLS Status Check' as check_type;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('trades', 'performance', 'users', 'User')
ORDER BY tablename;

SELECT 'Policy Count Check' as check_type;
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'performance', 'users', 'User')
GROUP BY schemaname, tablename
ORDER BY tablename; 