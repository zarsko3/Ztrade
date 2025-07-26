import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection by querying the models
    const tradeCount = await prisma.trade.count();
    const performanceCount = await prisma.performance.count();
    
    // Get some sample data
    const recentTrades = await prisma.trade.findMany({
      take: 3,
      orderBy: { entryDate: 'desc' },
      select: { id: true, ticker: true, entryDate: true, exitDate: true }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        models: {
          trade: {
            count: tradeCount,
            recent: recentTrades
          },
          performance: {
            count: performanceCount
          }
        }
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
} 