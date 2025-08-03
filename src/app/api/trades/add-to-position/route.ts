import { NextRequest, NextResponse } from 'next/server';
import { tradeService } from '@/services/trade-service';
import { AddToPositionRequest } from '@/types/trade';

export async function POST(request: NextRequest) {
  try {
    const body: AddToPositionRequest = await request.json();

    // Validate required fields
    if (!body.ticker || !body.entryDate || !body.entryPrice || !body.quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: ticker, entryDate, entryPrice, quantity' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (body.entryPrice <= 0 || body.quantity <= 0) {
      return NextResponse.json(
        { error: 'Entry price and quantity must be positive numbers' },
        { status: 400 }
      );
    }

    // Check if position exists
    const hasPosition = await tradeService.hasOpenPosition(body.ticker);
    if (!hasPosition) {
      return NextResponse.json(
        { error: 'No open position found for this ticker' },
        { status: 404 }
      );
    }

    // Add to position
    const updatedPosition = await tradeService.addToPosition(body);

    return NextResponse.json({
      success: true,
      position: updatedPosition,
      message: 'Successfully added to position'
    });
  } catch (error) {
    console.error('Error adding to position:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to add to position',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 