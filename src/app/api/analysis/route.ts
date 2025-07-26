import { TradeAnalysisService } from '@/services/trade-analysis-service';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// Import Trade type from the service
type Trade = Parameters<typeof TradeAnalysisService.generateTradeAnalysis>[0][0];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timeframe = 'all', ticker } = body;

    // Build query based on timeframe
    const whereClause: Record<string, unknown> = {};
    
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (timeframe) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      whereClause.entryDate = {
        gte: startDate,
      };
    }

    if (ticker) {
      whereClause.ticker = ticker;
    }

    // Fetch trades from database
    const trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: { entryDate: 'desc' },
    });

    // Generate analysis
    const analysis = TradeAnalysisService.generateTradeAnalysis(trades as unknown as Trade[]);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error generating trade analysis:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate trade analysis',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
} 