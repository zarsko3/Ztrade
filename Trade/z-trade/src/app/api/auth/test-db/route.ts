import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Basic connection
    let connectionTest = false;
    try {
      await prisma.$connect();
      connectionTest = true;
      console.log('✅ Database connection successful');
    } catch (error) {
      console.log('❌ Database connection failed:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          debug: { error: error.message }
        },
        { status: 500 }
      );
    }

    // Test 2: Check if tables exist
    let tablesTest = false;
    try {
      const userCount = await prisma.user.count();
      const tradeCount = await prisma.trade.count();
      tablesTest = true;
      console.log('✅ Tables exist - Users:', userCount, 'Trades:', tradeCount);
    } catch (error) {
      console.log('❌ Tables check failed:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database tables not found',
          debug: { error: error.message }
        },
        { status: 500 }
      );
    }

    // Test 3: Try to create a test user
    let createTest = false;
    let testUserId = null;
    try {
      const testUser = await prisma.user.create({
        data: {
          username: `test_${Date.now()}`,
          password: 'test_password_hash',
          email: `test_${Date.now()}@example.com`,
          name: 'Test User',
          role: 'user',
          isActive: true
        }
      });
      testUserId = testUser.id;
      createTest = true;
      console.log('✅ User creation test successful');
    } catch (error) {
      console.log('❌ User creation test failed:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'User creation failed',
          debug: { error: error.message }
        },
        { status: 500 }
      );
    }

    // Clean up test user
    if (testUserId) {
      try {
        await prisma.user.delete({
          where: { id: testUserId }
        });
        console.log('✅ Test user cleaned up');
      } catch (error) {
        console.log('⚠️ Could not clean up test user:', error);
      }
    }

    return NextResponse.json({
      success: true,
      database: {
        connection: connectionTest,
        tables: tablesTest,
        createUser: createTest,
        timestamp: new Date().toISOString()
      },
      message: 'Database connection test completed'
    });
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database test failed',
        debug: { error: error.message }
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 