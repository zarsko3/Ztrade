import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock S&P 500 data for testing
    const mockSP500Data = {
      symbol: 'S&P 500',
      currentPrice: 4850.25,
      change: 15.75,
      changePercent: 0.33,
      lastUpdated: new Date().toISOString().split('T')[0],
      historicalData: [
        {
          date: new Date().toISOString().split('T')[0],
          open: 4835.50,
          high: 4855.75,
          low: 4830.25,
          close: 4850.25,
          volume: 2500000000
        },
        {
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          open: 4820.00,
          high: 4840.50,
          low: 4815.75,
          close: 4834.50,
          volume: 2450000000
        }
      ]
    };

    return NextResponse.json(mockSP500Data);
  } catch (error) {
    console.error('Error in test market endpoint:', error);
    
    return NextResponse.json(
      { 
        error: 'Test market data generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 