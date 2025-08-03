import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emitTradeUpdate, createTradeUpdate } from '@/lib/websocket-utils';

export async function POST(
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

    // Check if trade is already closed
    if (existingTrade.exitDate && existingTrade.exitPrice) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Trade is already closed',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate required fields for closing
    const { exitDate, exitPrice } = body;
    
    if (!exitDate || !exitPrice) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Exit date and exit price are required to close a trade',
        },
        { status: 400 }
      );
    }
    
    // Validate exit price
    if (typeof exitPrice !== 'number' || exitPrice <= 0) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Exit price must be a positive number',
        },
        { status: 400 }
      );
    }
    
    // Validate exit date
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
    
    // Check if exit date is after entry date
    const entryDate = new Date(existingTrade.entryDate);
    if (exitDateObj <= entryDate) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Exit date must be after entry date',
        },
        { status: 400 }
      );
    }
    
    // Calculate trade metrics
    const entryValue = existingTrade.entryPrice * existingTrade.quantity;
    const exitValue = exitPrice * existingTrade.quantity;
    const fees = existingTrade.fees || 0;
    
    let profitLoss: number;
    if (existingTrade.isShort) {
      profitLoss = entryValue - exitValue - fees;
    } else {
      profitLoss = exitValue - entryValue - fees;
    }
    
    const profitLossPercentage = (profitLoss / entryValue) * 100;
    const holdingPeriod = Math.floor(
      (exitDateObj.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Update the trade with exit data
    const updatedTrade = await prisma.trade.update({
      where: { id },
      data: {
        exitDate: exitDateObj,
        exitPrice,
      },
      include: {
        performance: true
      }
    });

    // Emit WebSocket update
    emitTradeUpdate(createTradeUpdate(updatedTrade.id.toString(), 'closed', updatedTrade));
    
    // Calculate additional metrics for response
    const tradeMetrics = {
      profitLoss,
      profitLossPercentage,
      holdingPeriod,
      isOpen: false,
      entryValue,
      exitValue,
      fees,
      totalReturn: profitLossPercentage,
    };
    
    return NextResponse.json({
      status: 'success',
      message: 'Trade closed successfully',
      data: {
        ...updatedTrade,
        metrics: tradeMetrics
      }
    });
  } catch (error) {
    console.error('Error closing trade:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to close trade',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 