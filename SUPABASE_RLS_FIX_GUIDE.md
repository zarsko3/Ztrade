# 🔒 Supabase RLS Security Fix Guide

## 🚨 Critical Security Issue

Your Supabase database has **Row Level Security (RLS) policies defined but RLS is NOT enabled** on the underlying tables. This means:

- ❌ **Data is wide open** to anyone with the anon key
- ❌ **RLS policies are ignored** completely
- ❌ **No data isolation** between users
- ❌ **Security vulnerability** that needs immediate attention

## 📋 Affected Tables

- `public.performance` - RLS disabled, yet policies exist
- `public.trades` - RLS disabled, yet policies exist  
- `public.users` - RLS disabled, yet policies exist
- `public."User"` - RLS disabled, yet policies exist

## 🔧 How to Fix

### Step 1: Run the RLS Fix Script

1. **Open your Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project: `khfzxzkpdxxsxhbmntel`

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste the fix script**
   - Open `scripts/fix-supabase-rls.sql` in your project
   - Copy the entire contents
   - Paste into the Supabase SQL Editor

4. **Execute the script**
   - Click "Run" to execute the SQL commands
   - This will:
     - Enable RLS on all tables
     - Create comprehensive security policies
     - Verify the configuration

### Step 2: Verify the Fix

Run the verification script to confirm the fix worked:

```bash
node scripts/verify-rls-security.js
```

**Expected output after fix:**
```
✅ Anonymous access to trades: BLOCKED (expected)
✅ Anonymous access to performance: BLOCKED (expected)
✅ RLS is enabled and policies are configured
```

### Step 3: Test Your Application

1. **Test with anonymous access** (should be blocked)
2. **Test with authenticated users** (should work for their own data)
3. **Test with service role** (should work for admin operations)

## 🛡️ What the Fix Does

### Enables RLS on All Tables
```sql
ALTER TABLE public.performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
```

### Creates Security Policies

**For Trades Table:**
- Users can only read/insert/update/delete their own trades
- Uses `user_id = auth.uid()` to ensure data isolation

**For Performance Table:**
- Users can only access their own performance data
- Complete CRUD operations with user isolation

**For Users Table:**
- Users can only read/update their own user data
- Service role can manage all users (for admin operations)

**For "User" Table (Prisma-generated):**
- Same policies as users table
- Handles the capitalized table name

## 🔍 Verification Commands

After running the fix, you can verify in Supabase SQL Editor:

```sql
-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('trades', 'performance', 'users', 'User')
ORDER BY tablename;

-- List all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 🚨 Important Notes

### Before Running the Fix
1. **Backup your data** if you have important production data
2. **Test in development** first if possible
3. **Have your service role key ready** for admin operations

### After Running the Fix
1. **Test all application features** to ensure they still work
2. **Verify user data isolation** - users should only see their own data
3. **Check admin operations** still work with service role

### If Something Goes Wrong
1. **Don't panic** - the fix is reversible
2. **Check the error messages** in Supabase logs
3. **Verify table names** match exactly (case-sensitive)
4. **Ensure user_id column exists** on all tables

## 🔄 Rollback Plan

If you need to rollback, you can disable RLS:

```sql
-- Disable RLS (emergency rollback)
ALTER TABLE public.performance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" DISABLE ROW LEVEL SECURITY;

-- Drop policies (if needed)
DROP POLICY IF EXISTS "Users can read their own trades" ON public.trades;
-- ... (repeat for all policies)
```

## 📞 Support

If you encounter issues:
1. Check the Supabase logs in the dashboard
2. Verify your table structure matches the expected schema
3. Test with the verification script
4. Check that your application is using the correct user authentication

## ✅ Success Criteria

After the fix, you should see:
- ✅ RLS enabled on all tables
- ✅ Anonymous access blocked
- ✅ Authenticated users can access their own data
- ✅ Service role can perform admin operations
- ✅ No more Supabase linter errors
- ✅ Application functionality preserved

---

**⚠️ This is a critical security fix. Please implement it as soon as possible to protect your users' data.** 