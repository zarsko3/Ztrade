import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tradeService } from '@/services/trade-service';
import { emitTradeUpdate, createTradeUpdate } from '@/lib/websocket-utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate trade ID
    const tradeId = parseInt(id);
    if (isNaN(tradeId) || tradeId <= 0) {
      return NextResponse.json(
        { error: 'Invalid trade ID. Must be a positive integer.' },
        { status: 400 }
      );
    }

    // Get trade from service
    const trade = await tradeService.getTradeById(tradeId);

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: trade
    });
  } catch (error) {
    console.error('Error in GET /api/trades/[id]:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve trade',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid trade ID. Must be a number.',
        },
        { status: 400 }
      );
    }

    // Check if trade exists
    const existingTrade = await prisma.trade.findUnique({
      where: { id }
    });

    if (!existingTrade) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Trade not found',
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate and prepare update data
    const updateData: Record<string, unknown> = {};
    
    // Validate ticker if provided
    if (body.ticker !== undefined) {
      if (typeof body.ticker !== 'string' || body.ticker.trim().length === 0) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Ticker must be a non-empty string',
          },
          { status: 400 }
        );
      }
      updateData.ticker = body.ticker.toUpperCase().trim();
    }
    
    // Validate entry price if provided
    if (body.entryPrice !== undefined) {
      if (typeof body.entryPrice !== 'number' || body.entryPrice <= 0) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Entry price must be a positive number',
          },
          { status: 400 }
        );
      }
      updateData.entryPrice = body.entryPrice;
    }
    
    // Validate quantity if provided
    if (body.quantity !== undefined) {
      if (typeof body.quantity !== 'number' || body.quantity <= 0 || !Number.isInteger(body.quantity)) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Quantity must be a positive integer',
          },
          { status: 400 }
        );
      }
      updateData.quantity = body.quantity;
    }
    
    // Validate exit data if provided
    if (body.exitDate !== undefined || body.exitPrice !== undefined) {
      const exitDate = body.exitDate !== undefined ? body.exitDate : existingTrade.exitDate;
      const exitPrice = body.exitPrice !== undefined ? body.exitPrice : existingTrade.exitPrice;
      
      if (exitDate && !exitPrice) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Exit price is required when exit date is provided',
          },
          { status: 400 }
        );
      }
      
      if (exitPrice && !exitDate) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Exit date is required when exit price is provided',
          },
          { status: 400 }
        );
      }
      
      if (exitPrice && typeof exitPrice !== 'number' || exitPrice <= 0) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Exit price must be a positive number',
          },
          { status: 400 }
        );
      }
      
      // Validate dates
      const entryDate = body.entryDate ? new Date(body.entryDate) : new Date(existingTrade.entryDate);
      if (exitDate) {
        const exitDateObj = new Date(exitDate);
        if (isNaN(exitDateObj.getTime())) {
          return NextResponse.json(
            {
              status: 'error',
              message: 'Invalid exit date format',
            },
            { status: 400 }
          );
        }
        
        if (exitDateObj <= entryDate) {
          return NextResponse.json(
            {
              status: 'error',
              message: 'Exit date must be after entry date',
            },
            { status: 400 }
          );
        }
        
        updateData.exitDate = exitDateObj;
        updateData.exitPrice = exitPrice;
      }
    }
    
    // Validate entry date if provided
    if (body.entryDate !== undefined) {
      const entryDateObj = new Date(body.entryDate);
      if (isNaN(entryDateObj.getTime())) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Invalid entry date format',
          },
          { status: 400 }
        );
      }
      
      // Check if new entry date conflicts with existing exit date
      if (existingTrade.exitDate && entryDateObj >= existingTrade.exitDate) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Entry date must be before exit date',
          },
          { status: 400 }
        );
      }
      
      updateData.entryDate = entryDateObj;
    }
    
    // Handle optional fields
    if (body.fees !== undefined) {
      updateData.fees = body.fees;
    }
    
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }
    
    if (body.tags !== undefined) {
      updateData.tags = body.tags;
    }
    
    if (body.isShort !== undefined) {
      updateData.isShort = Boolean(body.isShort);
    }
    
    // Update the trade
    const updatedTrade = await prisma.trade.update({
      where: { id },
      data: updateData,
      include: {
        performance: true
      }
    });

    // Emit WebSocket update
    emitTradeUpdate(createTradeUpdate(updatedTrade.id.toString(), 'updated', updatedTrade));
    
    return NextResponse.json({
      status: 'success',
      message: 'Trade updated successfully',
      data: updatedTrade,
    });
  } catch (error) {
    console.error('Error updating trade:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to update trade',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid trade ID. Must be a number.',
        },
        { status: 400 }
      );
    }

    // Check if trade exists
    const existingTrade = await prisma.trade.findUnique({
      where: { id }
    });

    if (!existingTrade) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Trade not found',
        },
        { status: 404 }
      );
    }

    // Allow deletion of any trade (open or closed)
    // Note: This allows users to delete trades with incorrect data

    // Delete the trade
    await prisma.trade.delete({
      where: { id }
    });

    // Emit WebSocket update
    emitTradeUpdate(createTradeUpdate(existingTrade.id.toString(), 'deleted', existingTrade));
    
    return NextResponse.json({
      status: 'success',
      message: 'Trade deleted successfully',
      data: {
        id,
        ticker: existingTrade.ticker,
        deletedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error deleting trade:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to delete trade',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 