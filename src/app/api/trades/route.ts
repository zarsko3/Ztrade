import { NextRequest, NextResponse } from 'next/server';
import { tradeService } from '@/services/trade-service';
import { TradeListRequest } from '@/types/trade';
import { emitTradeUpdate, createTradeUpdate } from '@/lib/websocket-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const tradeRequest: TradeListRequest = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      sortBy: searchParams.get('sortBy') as any || 'entryDate',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
      ticker: searchParams.get('ticker') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      status: searchParams.get('status') as any || 'all',
      search: searchParams.get('search') || undefined
    };

    // Validate parameters
    if (tradeRequest.page && tradeRequest.page < 1) {
      return NextResponse.json(
        { error: 'Page must be greater than 0' },
        { status: 400 }
      );
    }

    if (tradeRequest.limit && (tradeRequest.limit < 1 || tradeRequest.limit > 100)) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (tradeRequest.sortBy && !['entryDate', 'ticker', 'profitLoss', 'createdAt'].includes(tradeRequest.sortBy)) {
      return NextResponse.json(
        { error: 'Invalid sortBy parameter' },
        { status: 400 }
      );
    }

    if (tradeRequest.sortOrder && !['asc', 'desc'].includes(tradeRequest.sortOrder)) {
      return NextResponse.json(
        { error: 'Invalid sortOrder parameter' },
        { status: 400 }
      );
    }

    if (tradeRequest.status && !['open', 'closed', 'all'].includes(tradeRequest.status)) {
      return NextResponse.json(
        { error: 'Invalid status parameter' },
        { status: 400 }
      );
    }

    // Get trades from service
    const result = await tradeService.getTrades(tradeRequest);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/trades:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve trades',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('API received trade data:', body);
    
    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['ticker', 'entryDate', 'entryPrice', 'quantity'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate data types
    if (typeof body.ticker !== 'string' || body.ticker.trim() === '') {
      return NextResponse.json(
        { error: 'Ticker must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof body.entryPrice !== 'number' || body.entryPrice <= 0) {
      return NextResponse.json(
        { error: 'Entry price must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof body.quantity !== 'number' || body.quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof body.isShort !== 'boolean') {
      return NextResponse.json(
        { error: 'isShort must be a boolean value' },
        { status: 400 }
      );
    }

    // Create trade using service
    const trade = await tradeService.createTrade(body);

    // Emit WebSocket update
    emitTradeUpdate(createTradeUpdate(trade.id.toString(), 'created', trade));

    return NextResponse.json(
      { 
        success: true,
        trade,
        message: 'Trade created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/trades:', error);
    
    // Handle specific validation errors
    if (error instanceof Error) {
      if (error.message.includes('Missing required fields')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes('Invalid') || error.message.includes('must be')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create trade',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 