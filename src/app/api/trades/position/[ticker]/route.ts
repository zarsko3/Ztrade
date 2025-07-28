import { NextRequest, NextResponse } from 'next/server';
import { tradeService } from '@/services/trade-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const { ticker } = params;

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker parameter is required' },
        { status: 400 }
      );
    }

    const position = await tradeService.getPosition(ticker);

    if (!position) {
      return NextResponse.json(
        { error: 'No open position found for this ticker' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      position
    });
  } catch (error) {
    console.error('Error fetching position:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch position',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 