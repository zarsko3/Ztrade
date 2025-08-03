import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (!symbol || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Symbol, startDate, and endDate parameters are required' },
        { status: 400 }
      );
    }

    console.log('Fetching historical data for symbol:', symbol, 'from', startDate, 'to', endDate);
    
    // Add timeout to Yahoo Finance API call
    const chart = await Promise.race([
      yahooFinance.chart(symbol, {
        period1: new Date(startDate),
        period2: new Date(endDate),
        interval: '1d'
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Yahoo Finance API timeout')), 15000) // 15 second timeout
      )
    ]) as any;

    if (!chart.quotes || chart.quotes.length === 0) {
      return NextResponse.json({
        status: 'success',
        data: []
      });
    }

    const result = chart.quotes.map((quote: any) => ({
      date: new Date(quote.date).toISOString(),
      open: quote.open || 0,
      high: quote.high || 0,
      low: quote.low || 0,
      close: quote.close || 0,
      volume: quote.volume || 0
    }));
    
    return NextResponse.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    
    // Return a more graceful error response
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch historical data - service temporarily unavailable',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 503 } // Service Unavailable instead of 500
    );
  }
} 