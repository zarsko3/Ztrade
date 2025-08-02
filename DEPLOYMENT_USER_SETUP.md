# Deployment User Setup Guide

## Current Authentication Setup

This application uses **Prisma with SQLite** for user authentication, not Firebase. Users are stored in a local database file.

## Issues with Current Setup

1. **Local vs Deployed Database**: Users created locally won't exist in the deployed environment
2. **Database Persistence**: The SQLite database file may not persist between deployments

## Solutions

### Option 1: Create Users via Script (Recommended)

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Create a user** using the provided script:
   ```bash
   npm run create-user <username> <password> [email] [name]
   ```

   Examples:
   ```bash
   # Create admin user
   npm run create-user admin password123 admin@example.com "Admin User"
   
   # Create regular user
   npm run create-user trader password456 trader@example.com "Trader User"
   
   # Create user without email/name
   npm run create-user demo demo123
   ```

3. **Verify user creation** by trying to log in with the credentials

### Option 2: Use Default Users (Development Only)

The application includes a method to create default users. You can call this in development:

```typescript
// In a script or API route
await AuthService.createDefaultUsers();
```

### Option 3: Switch to Supabase Authentication (Future Enhancement)

For production, consider migrating to Supabase authentication:

1. **Benefits**:
   - User management through Supabase dashboard
   - Email verification
   - Password reset functionality
   - Social login options
   - Better security

2. **Migration Steps**:
   - Update auth context to use Supabase auth
   - Modify login/register API routes
   - Update user model relationships

## Database Setup

### Local Development
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### Production Deployment
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

## Environment Variables

Make sure these are set in your deployment environment:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production"
```

## Troubleshooting

### User Can't Log In
1. Verify the user exists in the database
2. Check if the database file is accessible
3. Ensure JWT_SECRET is set correctly

### Database Connection Issues
1. Check DATABASE_URL environment variable
2. Ensure database file has proper permissions
3. Verify Prisma client is generated

### Deployment Issues
1. Make sure all dependencies are installed
2. Run `npx prisma generate` before building
3. Check that the database file is included in deployment 