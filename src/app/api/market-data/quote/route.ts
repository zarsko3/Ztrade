import { NextRequest, NextResponse } from 'next/server';
import { unifiedMarketDataManager } from '../../../../services/unified-market-data-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    console.log('Fetching unified quote for symbol:', symbol);
    
    // Initialize manager if not already done
    if (!unifiedMarketDataManager.isManagerInitialized()) {
      await unifiedMarketDataManager.initialize([symbol]);
    }
    
    const marketData = unifiedMarketDataManager.getMarketData([symbol]);
    const data = marketData[0];
    
    if (!data) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Symbol not found or no data available',
          symbol: symbol
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      status: 'success',
      data: {
        symbol: data.symbol,
        regularMarketPrice: data.price,
        regularMarketChange: data.change,
        regularMarketChangePercent: data.changePercent,
        regularMarketTime: new Date(data.lastUpdated).getTime() / 1000,
        regularMarketVolume: data.volume,
        dataQuality: data.dataQuality,
        source: data.source,
        lastUpdated: data.lastUpdated
      }
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch quote',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 