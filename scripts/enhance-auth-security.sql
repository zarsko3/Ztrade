-- Supabase Auth Security Enhancement Script
-- Addresses leaked password protection and MFA security warnings
-- Based on Supabase best practices from Context7 documentation

-- 1. ENABLE LEAKED PASSWORD PROTECTION
-- This enables checking against HaveIBeenPwned.org database
-- to prevent users from using compromised passwords

-- Enable leaked password protection via Supabase Dashboard or CLI
-- Note: This requires Supabase CLI or Dashboard access
-- CLI command: supabase auth config --enable-leaked-password-protection

SELECT '=== LEAKED PASSWORD PROTECTION ===' as security_feature;

-- Check current password security settings
SELECT 
  'To enable leaked password protection:' as instruction,
  '1. Go to Supabase Dashboard > Authentication > Settings' as step1,
  '2. Enable "Leaked password protection"' as step2,
  '3. This will check passwords against HaveIBeenPwned.org' as step3,
  '4. Users will be prevented from using compromised passwords' as step4;

-- 2. ENABLE MULTI-FACTOR AUTHENTICATION (MFA)
-- Enable multiple MFA options for enhanced security

SELECT '=== MULTI-FACTOR AUTHENTICATION SETUP ===' as security_feature;

-- Enable TOTP (Time-based One-Time Password) MFA
-- This allows users to use authenticator apps like Google Authenticator

-- Enable TOTP MFA via Supabase Dashboard
SELECT 
  'To enable TOTP MFA:' as instruction,
  '1. Go to Supabase Dashboard > Authentication > Settings' as step1,
  '2. Enable "Multi-factor authentication"' as step2,
  '3. Select "TOTP (Authenticator app)"' as step3,
  '4. Users can then enroll using authenticator apps' as step4;

-- Enable Phone MFA (SMS/WhatsApp)
SELECT 
  'To enable Phone MFA:' as instruction,
  '1. Go to Supabase Dashboard > Authentication > Settings' as step1,
  '2. Enable "Multi-factor authentication"' as step2,
  '3. Select "Phone (SMS/WhatsApp)"' as step3,
  '4. Configure SMS provider settings' as step4;

-- 3. CREATE MFA-ENFORCED RLS POLICIES
-- Optional: Create policies that require MFA for sensitive operations

SELECT '=== MFA-ENFORCED RLS POLICIES ===' as security_feature;

-- Example: Create a policy that requires MFA for sensitive data access
-- This ensures users must complete MFA to access certain tables

-- Policy for trades table requiring MFA
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trades') THEN
    
    -- Create MFA-required policy for sensitive operations
    CREATE POLICY IF NOT EXISTS "trades_mfa_required"
      ON public.trades
      FOR ALL
      TO authenticated
      USING (
        -- Allow access only if user has completed MFA (aal2)
        (SELECT auth.jwt()->>'aal') = 'aal2'
        AND user_id = (SELECT auth.uid())::text
      )
      WITH CHECK (
        (SELECT auth.jwt()->>'aal') = 'aal2'
        AND user_id = (SELECT auth.uid())::text
      );
      
    RAISE NOTICE 'Created MFA-required policy for trades table';
  END IF;
END $$;

-- Policy for performance table requiring MFA
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'performance') THEN
    
    CREATE POLICY IF NOT EXISTS "performance_mfa_required"
      ON public.performance
      FOR ALL
      TO authenticated
      USING (
        (SELECT auth.jwt()->>'aal') = 'aal2'
        AND user_id = (SELECT auth.uid())::text
      )
      WITH CHECK (
        (SELECT auth.jwt()->>'aal') = 'aal2'
        AND user_id = (SELECT auth.uid())::text
      );
      
    RAISE NOTICE 'Created MFA-required policy for performance table';
  END IF;
END $$;

-- 4. CREATE MFA ENROLLMENT HELPER FUNCTIONS
-- Functions to help manage MFA enrollment in your application

SELECT '=== MFA HELPER FUNCTIONS ===' as security_feature;

-- Function to check if user has MFA enrolled
CREATE OR REPLACE FUNCTION public.user_has_mfa_enrolled()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has verified MFA factors
  RETURN EXISTS (
    SELECT 1 
    FROM auth.mfa_factors 
    WHERE user_id = auth.uid() 
      AND status = 'verified'
  );
END;
$$;

-- Function to get user's MFA status
CREATE OR REPLACE FUNCTION public.get_user_mfa_status()
RETURNS TABLE(
  has_mfa boolean,
  factor_count integer,
  factor_types text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS (
      SELECT 1 
      FROM auth.mfa_factors 
      WHERE user_id = auth.uid() 
        AND status = 'verified'
    ) as has_mfa,
    COUNT(*)::integer as factor_count,
    ARRAY_AGG(factor_type) as factor_types
  FROM auth.mfa_factors 
  WHERE user_id = auth.uid() 
    AND status = 'verified';
END;
$$;

-- 5. CREATE PASSWORD STRENGTH VALIDATION
-- Function to validate password strength

SELECT '=== PASSWORD STRENGTH VALIDATION ===' as security_feature;

-- Function to validate password strength
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS TABLE(
  is_valid boolean,
  errors text[]
)
LANGUAGE plpgsql
AS $$
DECLARE
  error_list text[] := ARRAY[]::text[];
BEGIN
  -- Check minimum length (8 characters)
  IF length(password) < 8 THEN
    error_list := array_append(error_list, 'Password must be at least 8 characters long');
  END IF;
  
  -- Check for uppercase letter
  IF password !~ '[A-Z]' THEN
    error_list := array_append(error_list, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Check for lowercase letter
  IF password !~ '[a-z]' THEN
    error_list := array_append(error_list, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Check for number
  IF password !~ '[0-9]' THEN
    error_list := array_append(error_list, 'Password must contain at least one number');
  END IF;
  
  -- Check for special character
  IF password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    error_list := array_append(error_list, 'Password must contain at least one special character');
  END IF;
  
  RETURN QUERY
  SELECT 
    array_length(error_list, 1) IS NULL OR array_length(error_list, 1) = 0 as is_valid,
    error_list as errors;
END;
$$;

-- 6. SECURITY AUDIT QUERIES
-- Queries to audit your current security setup

SELECT '=== SECURITY AUDIT ===' as security_feature;

-- Check current MFA enrollment status
SELECT 
  'Current MFA Status:' as audit_type,
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
SELECT 
  'MFA Factor Types:' as audit_type,
  factor_type,
  status,
  COUNT(*) as count
FROM auth.mfa_factors
GROUP BY factor_type, status
ORDER BY factor_type, status;

-- 7. RECOMMENDED SECURITY SETTINGS
-- Summary of recommended security configurations

SELECT '=== RECOMMENDED SECURITY SETTINGS ===' as security_feature;

SELECT 
  'Dashboard Settings to Configure:' as setting_category,
  'Authentication > Settings > Password Strength' as setting1,
  'Authentication > Settings > Leaked Password Protection' as setting2,
  'Authentication > Settings > Multi-factor Authentication' as setting3,
  'Authentication > Settings > Session Management' as setting4;

SELECT 
  'Recommended Values:' as recommendation_type,
  'Minimum password length: 12 characters' as password_length,
  'Require: Uppercase, lowercase, numbers, symbols' as password_complexity,
  'Enable leaked password protection' as leaked_protection,
  'Enable TOTP and Phone MFA' as mfa_options,
  'Session timeout: 1 hour' as session_timeout;

-- 8. CLIENT-SIDE IMPLEMENTATION GUIDANCE
-- Guidance for implementing MFA in your application

SELECT '=== CLIENT-SIDE IMPLEMENTATION ===' as implementation_type;

SELECT 
  'JavaScript/TypeScript MFA Implementation:' as language,
  'Use supabase.auth.mfa.enroll() for TOTP setup' as step1,
  'Use supabase.auth.mfa.challenge() for verification' as step2,
  'Use supabase.auth.mfa.verify() to complete MFA' as step3,
  'Check auth.jwt()->>''aal'' for MFA status' as step4;

SELECT 
  'React Component Example:' as example_type,
  'See scripts/mfa-enrollment-component.tsx' as file1,
  'See scripts/mfa-verification-component.tsx' as file2,
  'See scripts/mfa-status-check.tsx' as file3;

-- 9. MONITORING AND ALERTS
-- Queries for monitoring security events

SELECT '=== MONITORING QUERIES ===' as monitoring_type;

-- Query to monitor failed MFA attempts
SELECT 
  'Failed MFA Attempts (Last 24h):' as monitoring_query,
  'SELECT * FROM auth.audit_log_entries WHERE event_type = ''mfa_challenge_verified'' AND created_at > now() - interval ''24 hours'' AND success = false;' as query;

-- Query to monitor password changes
SELECT 
  'Password Changes (Last 24h):' as monitoring_query,
  'SELECT * FROM auth.audit_log_entries WHERE event_type = ''user_updated'' AND created_at > now() - interval ''24 hours'';' as query;

-- 10. COMPLIANCE AND REPORTING
-- Queries for security compliance reporting

SELECT '=== COMPLIANCE REPORTING ===' as compliance_type;

-- Security compliance summary
SELECT 
  'Security Compliance Summary:' as report_type,
  'Total users: ' || (SELECT COUNT(*) FROM auth.users) as total_users,
  'Users with MFA: ' || (
    SELECT COUNT(*) 
    FROM auth.users u 
    WHERE EXISTS (
      SELECT 1 FROM auth.mfa_factors f 
      WHERE f.user_id = u.id AND f.status = 'verified'
    )
  ) as users_with_mfa,
  'MFA adoption rate: ' || (
    SELECT ROUND(
      COUNT(CASE WHEN EXISTS (
        SELECT 1 FROM auth.mfa_factors f 
        WHERE f.user_id = u.id AND f.status = 'verified'
      ) THEN 1 END) * 100.0 / COUNT(*), 2
    )
    FROM auth.users u
  ) || '%' as mfa_adoption_rate;

-- Final security recommendations
SELECT '=== FINAL RECOMMENDATIONS ===' as final_type;

SELECT 
  'Immediate Actions Required:' as action_type,
  '1. Enable leaked password protection in Supabase Dashboard' as action1,
  '2. Enable TOTP and Phone MFA options' as action2,
  '3. Implement MFA enrollment flow in your app' as action3,
  '4. Add MFA-required policies for sensitive data' as action4,
  '5. Monitor security events regularly' as action5;
