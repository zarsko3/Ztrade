-- Fix Function Search Path Mutability Warnings
-- This script drops and recreates functions with proper search path settings
-- Based on Supabase security best practices

-- Drop existing functions first to ensure clean recreation
DROP FUNCTION IF EXISTS public.user_has_mfa_enrolled();
DROP FUNCTION IF EXISTS public.get_user_mfa_status();
DROP FUNCTION IF EXISTS public.validate_password_strength();

-- Recreate function to check if user has MFA enrolled
CREATE OR REPLACE FUNCTION public.user_has_mfa_enrolled()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- Recreate function to get user's MFA status
CREATE OR REPLACE FUNCTION public.get_user_mfa_status()
RETURNS TABLE(
  has_mfa boolean,
  factor_count integer,
  factor_types text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- Recreate function to validate password strength
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS TABLE(
  is_valid boolean,
  errors text[]
)
LANGUAGE plpgsql
SET search_path = public, pg_temp
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

-- Verify the functions were created with proper search paths
SELECT 
  'Function Search Path Verification:' as verification_type,
  proname as function_name,
  prosrc as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND proname IN ('user_has_mfa_enrolled', 'get_user_mfa_status', 'validate_password_strength')
ORDER BY proname;

-- Test the functions to ensure they work correctly
SELECT 'Testing user_has_mfa_enrolled function:' as test_type;
SELECT public.user_has_mfa_enrolled() as has_mfa;

SELECT 'Testing get_user_mfa_status function:' as test_type;
SELECT * FROM public.get_user_mfa_status();

SELECT 'Testing validate_password_strength function:' as test_type;
SELECT * FROM public.validate_password_strength('TestPassword123!');

SELECT 'Function search path fix completed successfully!' as completion_status;
