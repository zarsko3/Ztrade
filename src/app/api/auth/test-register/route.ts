import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, email, name } = body;

    console.log('🔍 Testing registration with:', { username, email, name });

    // Check environment variables
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV || 'development'
    };

    // Test database connection
    let dbConnection = false;
    try {
      await prisma.$connect();
      dbConnection = true;
    } catch (error) {
      console.error('Database connection failed:', error);
    }

    // Test user creation
    const result = await AuthService.register({ username, password, email, name });

    // Get user count
    let userCount = 0;
    try {
      userCount = await prisma.user.count();
    } catch (error) {
      console.error('Error counting users:', error);
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      user: result.user,
      debug: {
        environment: envCheck,
        databaseConnection: dbConnection,
        userCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Test registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        debug: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 