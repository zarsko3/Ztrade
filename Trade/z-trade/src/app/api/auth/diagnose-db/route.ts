import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Production Database Diagnostic Started');
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        JWT_SECRET_SET: !!process.env.JWT_SECRET,
        DATABASE_TYPE: process.env.DATABASE_URL?.startsWith('postgresql:') ? 'PostgreSQL' : 
                      process.env.DATABASE_URL?.startsWith('file:') ? 'SQLite' : 'Unknown'
      },
      connection: {
        success: false,
        error: null
      },
      schema: {
        tables: [],
        userCount: null,
        tradeCount: null
      },
      recommendations: []
    };

    // Test 1: Basic Connection
    try {
      console.log('📡 Testing database connection...');
      await prisma.$connect();
      diagnostics.connection.success = true;
      console.log('✅ Database connection successful');
    } catch (error) {
      diagnostics.connection.error = error.message;
      console.log('❌ Database connection failed:', error.message);
      
      // Add specific recommendations based on error
      if (error.message.includes("Can't reach database server")) {
        diagnostics.recommendations.push({
          type: 'network',
          title: 'Database Server Unreachable',
          steps: [
            '1. Go to https://supabase.com/dashboard',
            '2. Select your project',
            '3. Go to Database → Settings',
            '4. Check if database is paused (free tier auto-pauses)',
            '5. Click "Resume" if paused'
          ]
        });
      }
      
      if (error.message.includes("Error validating datasource")) {
        diagnostics.recommendations.push({
          type: 'schema',
          title: 'Schema Configuration Issue',
          steps: [
            '1. Check Prisma schema configuration',
            '2. Ensure provider matches database type',
            '3. Run: npx prisma generate',
            '4. Redeploy the application'
          ]
        });
      }
      
      if (error.message.includes("authentication failed")) {
        diagnostics.recommendations.push({
          type: 'auth',
          title: 'Authentication Failed',
          steps: [
            '1. Check database password in connection string',
            '2. Verify Supabase credentials',
            '3. Update DATABASE_URL in Vercel environment variables'
          ]
        });
      }
      
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Test 2: Schema Check
    try {
      console.log('📋 Checking database schema...');
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `;
      diagnostics.schema.tables = tables.map((t: any) => t.table_name);
      console.log('✅ Schema check successful');
    } catch (error) {
      console.log('⚠️ Schema check failed:', error.message);
      diagnostics.recommendations.push({
        type: 'schema',
        title: 'Schema Access Issue',
        steps: [
          '1. Database connected but schema not accessible',
          '2. Check if tables exist',
          '3. Run database migrations if needed'
        ]
      });
    }

    // Test 3: Table Access
    try {
      const userCount = await prisma.user.count();
      diagnostics.schema.userCount = userCount;
      console.log(`📊 Users table accessible: ${userCount} users`);
    } catch (error) {
      console.log('❌ Users table not accessible:', error.message);
      diagnostics.recommendations.push({
        type: 'migration',
        title: 'Users Table Missing',
        steps: [
          '1. Run database migrations',
          '2. Check if User table exists',
          '3. Verify Prisma schema matches database'
        ]
      });
    }

    try {
      const tradeCount = await prisma.trade.count();
      diagnostics.schema.tradeCount = tradeCount;
      console.log(`📊 Trades table accessible: ${tradeCount} trades`);
    } catch (error) {
      console.log('❌ Trades table not accessible:', error.message);
    }

    // Add success recommendations
    if (diagnostics.connection.success && diagnostics.schema.tables.length > 0) {
      diagnostics.recommendations.push({
        type: 'success',
        title: 'Database Working Correctly',
        steps: [
          '✅ Database connection successful',
          '✅ Schema accessible',
          '✅ Tables found',
          'Ready for user registration!'
        ]
      });
    }

    console.log('🔍 Diagnostic completed');
    return NextResponse.json(diagnostics);

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Diagnostic failed',
        debug: { error: error.message }
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 