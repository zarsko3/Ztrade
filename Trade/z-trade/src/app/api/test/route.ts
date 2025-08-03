import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  return Response.json({ message: 'API test working' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create_test_trade':
        const testTrade = await prisma.trade.create({
          data: {
            ticker: 'TEST',
            entryDate: new Date(),
            entryPrice: 100.00,
            quantity: 10,
            isShort: false,
            notes: 'Test trade created by API',
            tags: 'test,api'
          }
        });
        return NextResponse.json({
          status: 'success',
          message: 'Test trade created',
          trade: testTrade
        });

      case 'clear_test_data':
        const testTrades = await prisma.trade.findMany({
          where: { ticker: 'TEST' }
        });
        
        for (const trade of testTrades) {
          await prisma.trade.delete({
            where: { id: trade.id }
          });
        }
        
        return NextResponse.json({
          status: 'success',
          message: 'Test data cleared',
          deletedCount: testTrades.length
        });

      case 'generate_test_chart':
        return NextResponse.json({
          status: 'skipped',
          message: 'Chart service removed - using Recharts instead'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Test API POST error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 