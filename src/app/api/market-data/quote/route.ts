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
    
    let marketData = unifiedMarketDataManager.getMarketData([symbol]);
    let data = marketData[0];
    
    // If symbol not found in current data, try to fetch it dynamically
    if (!data) {
      console.log(`Symbol ${symbol} not in current data, fetching dynamically...`);
      try {
        // Add symbol to tracked symbols and update data
        await unifiedMarketDataManager.updateSymbols([...unifiedMarketDataManager.getAllMarketData().map(d => d.symbol), symbol]);
        marketData = unifiedMarketDataManager.getMarketData([symbol]);
        data = marketData[0];
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        return NextResponse.json(
          {
            status: 'error',
            message: 'Symbol not found or no data available',
            symbol: symbol
          },
          { status: 404 }
        );
      }
    }
    
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