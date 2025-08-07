# Supabase RLS Performance Optimization

This document explains the Row Level Security (RLS) performance optimizations applied to fix the Supabase linter warnings.

## Issues Addressed

### 1. 🔸 auth_rls_initplan
**Problem**: `auth.<function>()` calls in RLS policies were being evaluated on every row instead of once per statement.

**Solution**: Wrap auth function calls in `SELECT` statements to enable PostgreSQL's initPlan optimization.

**Before**:
```sql
CREATE POLICY "Users can access their own trades"
  ON public.trades
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

**After**:
```sql
CREATE POLICY "Users can access their own trades"
  ON public.trades
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

### 2. 🔸 multiple_permissive_policies
**Problem**: Too many permissive RLS policies for the same table, role, and action.

**Solution**: Consolidate multiple policies into fewer, more efficient policies.

**Before**:
```sql
-- Multiple separate policies
CREATE POLICY "Users can read their own trades" ON trades FOR SELECT TO authenticated USING (...);
CREATE POLICY "Users can insert their own trades" ON trades FOR INSERT TO authenticated WITH CHECK (...);
CREATE POLICY "Users can update their own trades" ON trades FOR UPDATE TO authenticated USING (...) WITH CHECK (...);
CREATE POLICY "Users can delete their own trades" ON trades FOR DELETE TO authenticated USING (...);
```

**After**:
```sql
-- Single consolidated policy
CREATE POLICY "trades_authenticated_access"
  ON public.trades
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);
```

## Performance Improvements

### 1. **Auth Function Optimization**
- **Before**: `auth.uid()` called for every row
- **After**: `(SELECT auth.uid())` called once per statement
- **Performance Gain**: 10-100x improvement for large tables

### 2. **Policy Consolidation**
- **Before**: 4-5 policies per table
- **After**: 1-2 policies per table
- **Performance Gain**: Reduced policy evaluation overhead

### 3. **Index Optimization**
- Added B-tree indexes on `user_id` columns
- **Performance Gain**: Faster RLS condition evaluation

## Tables Optimized

### 1. **trades**
- **Policy**: `trades_authenticated_access`
- **Index**: `idx_trades_user_id`
- **Access**: Users can only access their own trades

### 2. **performance**
- **Policy**: `performance_authenticated_access`
- **Index**: `idx_performance_user_id`
- **Access**: Users can only access their own performance data

### 3. **users**
- **Policy**: `users_authenticated_access` (for authenticated users)
- **Policy**: `users_service_role_access` (for service role)
- **Index**: `idx_users_id`
- **Access**: Users can only access their own user data

## Implementation

### Running the Optimization

1. **Execute the optimization script**:
```bash
# Connect to your Supabase database and run:
\i scripts/fix-rls-performance-issues.sql
```

2. **Verify the changes**:
```sql
-- Check if auth_rls_initplan issues are resolved
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('trades', 'performance', 'users')
  AND qual LIKE '%(SELECT auth.uid())%';
```

3. **Test performance**:
```sql
-- Benchmark queries
EXPLAIN ANALYZE SELECT COUNT(*) FROM trades;
EXPLAIN ANALYZE SELECT COUNT(*) FROM performance;
EXPLAIN ANALYZE SELECT COUNT(*) FROM users;
```

### Verification Queries

```sql
-- Check for remaining auth_rls_initplan issues
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid())%' THEN 'OPTIMIZED'
    WHEN qual LIKE '%auth.uid()%' THEN 'NEEDS_OPTIMIZATION'
    ELSE 'NO_AUTH_FUNCTIONS'
  END as optimization_status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'performance', 'users', 'User');
```

## Best Practices Applied

### 1. **Use SELECT Wrapping**
Always wrap auth functions in SELECT statements:
```sql
-- ✅ Good
(SELECT auth.uid()) = user_id

-- ❌ Bad
auth.uid() = user_id
```

### 2. **Consolidate Policies**
Use `FOR ALL` instead of separate policies:
```sql
-- ✅ Good
CREATE POLICY "table_access" ON table_name FOR ALL TO authenticated USING (...);

-- ❌ Bad
CREATE POLICY "table_select" ON table_name FOR SELECT TO authenticated USING (...);
CREATE POLICY "table_insert" ON table_name FOR INSERT TO authenticated WITH CHECK (...);
CREATE POLICY "table_update" ON table_name FOR UPDATE TO authenticated USING (...) WITH CHECK (...);
CREATE POLICY "table_delete" ON table_name FOR DELETE TO authenticated USING (...);
```

### 3. **Add Indexes**
Always index columns used in RLS policies:
```sql
CREATE INDEX idx_table_user_id ON table_name USING btree (user_id);
```

### 4. **Explicit Role Specification**
Always specify target roles:
```sql
-- ✅ Good
TO authenticated

-- ❌ Bad
-- (applies to all roles)
```

## Monitoring and Maintenance

### 1. **Regular Performance Checks**
```sql
-- Monitor query performance
EXPLAIN ANALYZE SELECT COUNT(*) FROM trades WHERE user_id = 'some-user-id';
```

### 2. **Policy Review**
```sql
-- Review current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. **Index Usage**
```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;
```

## Troubleshooting

### Common Issues

1. **Policy Not Applied**
   - Check if RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'your_table';`
   - Verify user has correct role: `SELECT current_user, session_user;`

2. **Performance Still Poor**
   - Check if indexes exist: `\d+ table_name`
   - Verify auth function wrapping: Look for `(SELECT auth.uid())` in policies

3. **Permission Denied**
   - Check policy conditions: `SELECT qual, with_check FROM pg_policies WHERE policyname = 'policy_name';`
   - Verify user authentication: `SELECT auth.uid();`

### Rollback Plan

If issues occur, you can rollback to the original policies:

```sql
-- Drop optimized policies
DROP POLICY IF EXISTS "trades_authenticated_access" ON public.trades;
DROP POLICY IF EXISTS "performance_authenticated_access" ON public.performance;
DROP POLICY IF EXISTS "users_authenticated_access" ON public.users;

-- Recreate original policies (if you have backups)
-- ... original policy creation statements
```

## References

- [Supabase RLS Performance Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Context7 Supabase Documentation](https://context7.com/supabase/supabase)
