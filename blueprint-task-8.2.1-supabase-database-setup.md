# Blueprint: Task 8.2.1 - Set up Supabase PostgreSQL Database

## 📋 Blueprint Overview

**Goal**: Migrate from local SQLite database to production-ready PostgreSQL database using Supabase for multi-user support and data persistence.

**Expected Outcome**: A fully functional PostgreSQL database hosted on Supabase with all existing data migrated and the app configured to use the production database.

**Priority**: Critical (Required for production)
**Effort**: Medium (4-6 hours)
**Dependencies**: Task 8.1.1 (Quick Deploy) completed

## 🎯 Success Criteria

- [ ] Supabase project created and configured
- [ ] PostgreSQL database schema migrated from SQLite
- [ ] All existing data successfully migrated
- [ ] App configured to use Supabase database
- [ ] Database connection tested and working
- [ ] Backup and recovery procedures established

## 📋 Step-by-Step Actions

### 1. Supabase Project Setup
1. **Create Supabase account**
   - Go to https://supabase.com
   - Sign up with GitHub or email
   - Verify email address

2. **Create new project**
   - Click "New Project"
   - Choose organization
   - Enter project name (e.g., "trade-app-db")
   - Set database password (save securely)
   - Choose region closest to users
   - Click "Create new project"

3. **Wait for project initialization** (5-10 minutes)

### 2. Database Configuration
1. **Get connection details**
   - Go to Project Settings > Database
   - Copy connection string
   - Note database URL format: `postgresql://postgres:[password]@[host]:5432/postgres`

2. **Update Prisma schema**
   ```bash
   # Backup current schema
   cp prisma/schema.prisma prisma/schema.sqlite.backup
   
   # Update schema for PostgreSQL
   cp prisma/schema-production.prisma prisma/schema.prisma
   ```

3. **Verify schema changes**
   - Check that `provider = "postgresql"`
   - Ensure all models are included
   - Verify indexes and relationships

### 3. Environment Configuration
1. **Update local environment**
   ```bash
   # Add to .env.local
   DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
   ```

2. **Test local connection**
   ```bash
   npx prisma db pull
   npx prisma generate
   ```

3. **Update Vercel environment variables**
   - Go to Vercel project settings
   - Add/update DATABASE_URL with Supabase connection string

### 4. Database Migration
1. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

2. **Create initial migration**
   ```bash
   npx prisma migrate dev --name init-postgresql
   ```

3. **Verify migration success**
   - Check Supabase dashboard > Database > Migrations
   - Ensure all tables created correctly

### 5. Data Migration
1. **Export current SQLite data**
   ```bash
   # Create backup of current data
   cp prisma/dev.db prisma/dev.db.backup
   
   # Export data to SQL (if needed)
   sqlite3 prisma/dev.db ".dump" > data_backup.sql
   ```

2. **Migrate data to PostgreSQL**
   ```bash
   # Run seed script if available
   npm run prisma:seed
   
   # Or manually insert test data
   npx prisma db seed
   ```

3. **Verify data integrity**
   - Check all tables have data
   - Verify relationships work correctly
   - Test basic queries

### 6. Application Testing
1. **Test database connection**
   ```bash
   # Test connection locally
   npm run dev
   ```

2. **Verify all features work**
   - Add new trade
   - View trade list
   - Check analytics
   - Test export functionality

3. **Deploy and test production**
   ```bash
   vercel --prod
   ```

### 7. Security and Backup Setup
1. **Configure Row Level Security (RLS)**
   - Enable RLS on sensitive tables
   - Create policies for data access
   - Test security policies

2. **Set up automated backups**
   - Configure backup schedule in Supabase
   - Test backup restoration process
   - Document backup procedures

3. **Monitor database performance**
   - Check query performance
   - Monitor connection usage
   - Set up alerts for issues

## ⚠️ Potential Issues & Solutions

### Issue: Connection String Format
**Solution**: Ensure connection string follows Supabase format exactly

### Issue: Migration Failures
**Solution**: Check for SQLite-specific syntax that needs PostgreSQL equivalents

### Issue: Data Type Mismatches
**Solution**: Verify all data types are compatible between SQLite and PostgreSQL

### Issue: Performance Issues
**Solution**: Add database indexes and optimize queries

## 📊 Success Metrics

- [ ] Database connection successful
- [ ] All tables created with correct schema
- [ ] Data migration completed without errors
- [ ] App functionality verified with new database
- [ ] Backup procedures tested and working
- [ ] Performance acceptable for expected load

## 🔄 Next Steps After Completion

1. **Monitor database performance**
2. **Implement user authentication**
3. **Add rate limiting for database queries**
4. **Set up monitoring and alerting**

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Database Migration Best Practices](https://www.prisma.io/docs/guides/migrate)
- [Supabase Security Guide](https://supabase.com/docs/guides/auth/row-level-security) 