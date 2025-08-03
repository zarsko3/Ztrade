import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug authentication endpoint called');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if User table exists
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ User table exists with ${userCount} users`);
      
      // List all users
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          isActive: true,
          role: true,
          createdAt: true
        }
      });
      
      console.log('📋 Users in database:', users);
      
      // Test specific user lookup
      const zarskoUser = await prisma.user.findUnique({
        where: { username: 'zarsko' }
      });
      
      if (zarskoUser) {
        console.log('✅ User zarsko found:', {
          id: zarskoUser.id,
          username: zarskoUser.username,
          isActive: zarskoUser.isActive,
          role: zarskoUser.role
        });
        
        // Test password verification
        const testPassword = '123456';
        const isPasswordValid = await bcrypt.compare(testPassword, zarskoUser.password);
        console.log(`🔐 Password test for '123456': ${isPasswordValid ? 'VALID' : 'INVALID'}`);
        
        return NextResponse.json({
          success: true,
          message: 'Debug completed successfully',
          database: {
            connected: true,
            userCount,
            users,
            zarskoUser: {
              found: true,
              id: zarskoUser.id,
              username: zarskoUser.username,
              isActive: zarskoUser.isActive,
              role: zarskoUser.role,
              passwordValid: isPasswordValid
            }
          },
          environment: {
            JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
            DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
            NODE_ENV: process.env.NODE_ENV
          }
        });
      } else {
        console.log('❌ User zarsko not found');
        return NextResponse.json({
          success: false,
          message: 'User zarsko not found in database',
          database: {
            connected: true,
            userCount,
            users
          },
          environment: {
            JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
            DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
            NODE_ENV: process.env.NODE_ENV
          }
        });
      }
      
    } catch (tableError) {
      console.log('❌ User table error:', tableError);
      return NextResponse.json({
        success: false,
        message: 'User table does not exist or error occurred',
        error: tableError instanceof Error ? tableError.message : 'Unknown error',
        environment: {
          JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
          DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
          NODE_ENV: process.env.NODE_ENV
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({
      success: false,
      message: 'Debug failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
        NODE_ENV: process.env.NODE_ENV
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 