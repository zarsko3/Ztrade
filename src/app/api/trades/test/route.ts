import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Test API route called');
    
    // Test 1: Check authentication
    console.log('1. Testing authentication...');
    const { userId } = await auth();
    console.log('Auth result - userId:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Test 2: Check database connection
    console.log('2. Testing database connection...');
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    // Test 3: Get trades for the user
    console.log('3. Testing trade query...');
    const trades = await prisma.trade.findMany({
      where: { userId },
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });
    
    console.log('Found trades:', trades.length);
    
    return NextResponse.json({
      success: true,
      userId,
      userCount,
      tradesCount: trades.length,
      trades: trades.map(t => ({
        id: t.id,
        ticker: t.ticker,
        entryDate: t.entryDate,
        entryPrice: t.entryPrice,
        userId: t.userId
      }))
    });
    
  } catch (error) {
    console.error('Error in test API route:', error);
    
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 