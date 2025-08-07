-- Security Status Check Script
-- This script checks the current security status of your Supabase project
-- and identifies what needs to be fixed

-- Check current function search paths
SELECT '=== FUNCTION SEARCH PATH STATUS ===' as status_type;

SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  CASE 
    WHEN p.proconfig IS NULL OR array_position(p.proconfig, 'search_path=') IS NULL 
    THEN 'MUTABLE - NEEDS FIX'
    ELSE 'IMMUTABLE - OK'
  END as search_path_status,
  p.proconfig as function_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('user_has_mfa_enrolled', 'get_user_mfa_status', 'validate_password_strength')
ORDER BY p.proname;

-- Check MFA enrollment status
SELECT '=== MFA ENROLLMENT STATUS ===' as status_type;

SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN EXISTS (
    SELECT 1 FROM auth.mfa_factors 
    WHERE user_id = auth.users.id AND status = 'verified'
  ) THEN 1 END) as users_with_mfa,
  ROUND(
    COUNT(CASE WHEN EXISTS (
      SELECT 1 FROM auth.mfa_factors 
      WHERE user_id = auth.users.id AND status = 'verified'
    ) THEN 1 END) * 100.0 / COUNT(*), 2
  ) as mfa_adoption_percentage
FROM auth.users;

-- Check MFA factor types
SELECT '=== MFA FACTOR TYPES ===' as status_type;

SELECT 
  factor_type,
  status,
  COUNT(*) as count
FROM auth.mfa_factors
GROUP BY factor_type, status
ORDER BY factor_type, status;

-- Check RLS policies
SELECT '=== RLS POLICY STATUS ===' as status_type;

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
  END as auth_optimization
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'performance', 'users')
ORDER BY tablename, policyname;

-- Check for multiple permissive policies
SELECT '=== MULTIPLE PERMISSIVE POLICIES CHECK ===' as status_type;

SELECT 
  schemaname,
  tablename,
  roles,
  cmd,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) > 1 THEN 'CONFLICT - NEEDS CONSOLIDATION'
    ELSE 'OK'
  END as status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'performance', 'users')
  AND permissive = 't'
GROUP BY schemaname, tablename, roles, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, roles, cmd;

-- Check for anonymous access
SELECT '=== ANONYMOUS ACCESS CHECK ===' as status_type;

SELECT 
  schemaname,
  tablename,
  policyname,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'performance', 'users')
  AND 'anon' = ANY(roles)
ORDER BY tablename, policyname;

-- Security recommendations
SELECT '=== SECURITY RECOMMENDATIONS ===' as recommendations_type;

SELECT 
  'Dashboard Actions Required:' as action_category,
  '1. Enable leaked password protection in Authentication > Settings' as action1,
  '2. Enable TOTP MFA in Authentication > Settings' as action2,
  '3. Enable Phone MFA in Authentication > Settings' as action3,
  '4. Set minimum password length to 12 characters' as action4;

SELECT 
  'SQL Scripts to Run:' as script_category,
  '1. Run scripts/fix-function-search-paths.sql' as script1,
  '2. Run scripts/comprehensive-rls-cleanup.sql' as script2,
  '3. Run scripts/enhance-auth-security.sql' as script3;

SELECT 
  'Client-Side Implementation:' as client_category,
  '1. Integrate MFA enrollment components' as client1,
  '2. Add MFA verification flow' as client2,
  '3. Implement security status checks' as client3;

-- Final status summary
SELECT '=== FINAL STATUS SUMMARY ===' as summary_type;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
        AND p.proname IN ('user_has_mfa_enrolled', 'get_user_mfa_status', 'validate_password_strength')
        AND (p.proconfig IS NULL OR array_position(p.proconfig, 'search_path=') IS NULL)
    ) THEN '❌ Function search paths need fixing'
    ELSE '✅ Function search paths are secure'
  END as function_status;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public'
        AND tablename IN ('trades', 'performance', 'users')
        AND 'anon' = ANY(roles)
    ) THEN '❌ Anonymous access detected'
    ELSE '✅ No anonymous access'
  END as anonymous_access_status;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public'
        AND tablename IN ('trades', 'performance', 'users')
        AND permissive = 't'
      GROUP BY schemaname, tablename, roles, cmd
      HAVING COUNT(*) > 1
    ) THEN '❌ Multiple permissive policies detected'
    ELSE '✅ RLS policies are optimized'
  END as rls_policy_status;
