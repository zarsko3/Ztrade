import { TradeAnalysisService } from '@/services/trade-analysis-service';
import { NextResponse } from 'next/server';

// Import Trade type from the service
type Trade = Parameters<typeof TradeAnalysisService.generateTradeAnalysis>[0][0];

export async function GET() {
  try {
    // Sample trade data for testing
    const sampleTrades = [
      {
        id: 1,
        ticker: 'AAPL',
        entryDate: new Date('2023-01-15'),
        entryPrice: 135.83,
        exitDate: new Date('2023-02-10'),
        exitPrice: 151.73,
        quantity: 10,
        fees: 9.99,
        notes: 'Bought after earnings dip, sold after recovery',
        tags: 'earnings,tech,long-term',
        isShort: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        performanceId: null,
      },
      {
        id: 2,
        ticker: 'MSFT',
        entryDate: new Date('2023-02-01'),
        entryPrice: 247.81,
        exitDate: new Date('2023-03-15'),
        exitPrice: 265.44,
        quantity: 5,
        fees: 9.99,
        notes: 'Technical breakout play',
        tags: 'tech,breakout',
        isShort: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        performanceId: null,
      },
      {
        id: 3,
        ticker: 'TSLA',
        entryDate: new Date('2023-03-10'),
        entryPrice: 172.92,
        exitDate: new Date('2023-04-05'),
        exitPrice: 185.06,
        quantity: 8,
        fees: 9.99,
        notes: 'Swing trade based on technical support',
        tags: 'ev,tech,swing',
        isShort: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        performanceId: null,
      },
    ] as Record<string, unknown>[];
    
    // Test the analysis service
    const analysis = TradeAnalysisService.generateTradeAnalysis(sampleTrades as unknown as Trade[]);
    
    return NextResponse.json({
      success: true,
      message: 'Rule-based analysis test successful',
      data: analysis,
    });
  } catch (error) {
    console.error('Rule-based analysis test failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Rule-based analysis test failed',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
} 