import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'AAPL';
    
    console.log('Testing Yahoo Finance integration for symbol:', symbol);
    
    // Test current quote
    const quote = await yahooFinance.quote(symbol);
    
    // Test S&P 500 data
    const sp500Quote = await yahooFinance.quote('^GSPC');
    
    // Test historical data (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const chart = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });
    
    return NextResponse.json({
      status: 'success',
      message: 'Yahoo Finance integration test successful',
      data: {
        symbol,
        quote: {
          symbol: quote.symbol || symbol,
          regularMarketPrice: quote.regularMarketPrice || 0,
          regularMarketChange: quote.regularMarketChange || 0,
          regularMarketChangePercent: quote.regularMarketChangePercent || 0,
          regularMarketTime: quote.regularMarketTime || Date.now() / 1000,
          regularMarketDayHigh: quote.regularMarketDayHigh || 0,
          regularMarketDayLow: quote.regularMarketDayLow || 0,
          regularMarketVolume: quote.regularMarketVolume || 0,
          marketCap: quote.marketCap || 0,
          currency: quote.currency || 'USD'
        },
        sp500Data: {
          symbol: 'S&P 500',
          currentPrice: sp500Quote.regularMarketPrice || 0,
          change: sp500Quote.regularMarketChange || 0,
          changePercent: sp500Quote.regularMarketChangePercent || 0,
          lastUpdated: new Date((sp500Quote.regularMarketTime || Date.now() / 1000) * 1000)
        },
        historicalData: chart.quotes ? chart.quotes.slice(0, 3).map((q: any) => ({
          date: new Date(q.date).toISOString(),
          open: q.open || 0,
          high: q.high || 0,
          low: q.low || 0,
          close: q.close || 0,
          volume: q.volume || 0
        })) : [],
        testTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Yahoo Finance test failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Yahoo Finance integration test failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 