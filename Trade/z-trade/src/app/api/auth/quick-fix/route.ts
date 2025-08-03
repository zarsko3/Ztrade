import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Quick fix endpoint called');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check current DATABASE_URL
    const currentDbUrl = process.env.DATABASE_URL || 'NOT_SET';
    const isPooler = currentDbUrl.includes('pooler');
    const isDirect = currentDbUrl.includes(':5432');
    
    // Check if User table exists and count users
    let userCount = 0;
    let users = [];
    let zarskoUser = null;
    let passwordValid = false;
    
    try {
      userCount = await prisma.user.count();
      console.log(`✅ User table exists with ${userCount} users`);
      
      users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          isActive: true,
          role: true,
          createdAt: true
        }
      });
      
      // Check for zarsko user
      zarskoUser = await prisma.user.findUnique({
        where: { username: 'zarsko' }
      });
      
      if (zarskoUser) {
        // Test password
        passwordValid = await bcrypt.compare('123456', zarskoUser.password);
        console.log(`🔐 Password test for zarsko: ${passwordValid ? 'VALID' : 'INVALID'}`);
      }
      
    } catch (tableError) {
      console.log('❌ User table error:', tableError);
    }
    
    return NextResponse.json({
      success: true,
      currentEnvironment: {
        DATABASE_URL: currentDbUrl,
        JWT_SECRET: !!process.env.JWT_SECRET,
        NODE_ENV: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      },
      analysis: {
        isSQLite: currentDbUrl.includes('file:'),
        isPostgreSQL: currentDbUrl.includes('postgresql'),
        isPooler: isPooler,
        isDirect: isDirect,
        recommendation: isPooler 
          ? "⚠️ Using pooler connection - switch to direct connection for Prisma"
          : "✅ Using direct connection - this should work"
      },
      database: {
        connected: true,
        userCount,
        users,
        zarskoUser: zarskoUser ? {
          found: true,
          id: zarskoUser.id,
          username: zarskoUser.username,
          isActive: zarskoUser.isActive,
          role: zarskoUser.role,
          passwordValid
        } : {
          found: false
        }
      },
      nextSteps: isPooler ? [
        "1. Go to your Vercel dashboard",
        "2. Settings → Environment Variables", 
        "3. Update DATABASE_URL to use direct connection",
        "4. Format: postgresql://postgres:[PASSWORD]@db.khfzxzkpdxxsxhbmntel.supabase.co:5432/postgres"
      ] : [
        "1. Database connection is correct",
        "2. Check if user 'zarsko' exists",
        "3. Verify password hash is correct",
        "4. Test login with username: zarsko, password: 123456"
      ]
    });
    
  } catch (error) {
    console.error('❌ Quick fix error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      currentEnvironment: {
        DATABASE_URL: process.env.DATABASE_URL || 'NOT_SET',
        JWT_SECRET: !!process.env.JWT_SECRET,
        NODE_ENV: process.env.NODE_ENV
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 