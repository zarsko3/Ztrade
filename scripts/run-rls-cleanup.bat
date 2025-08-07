@echo off
echo ========================================
echo Supabase RLS Performance Cleanup
echo ========================================
echo.
echo This script will fix multiple_permissive_policies warnings
echo by consolidating RLS policies for better performance.
echo.
echo WARNING: This will remove existing conflicting policies.
echo Make sure you have a backup of your database.
echo.
pause

echo.
echo Running comprehensive RLS cleanup...
echo.

REM You can run this script in your Supabase SQL editor
echo Copy and paste the contents of 'scripts/comprehensive-rls-cleanup.sql'
echo into your Supabase SQL editor and execute it.
echo.
echo The script will:
echo 1. Remove all conflicting policies
echo 2. Create optimized consolidated policies
echo 3. Add performance indexes
echo 4. Verify the changes
echo.
echo After running, check your Supabase linter to confirm
echo the multiple_permissive_policies warnings are resolved.
echo.

pause
