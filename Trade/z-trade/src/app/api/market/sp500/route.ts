import { NextRequest, NextResponse } from 'next/server';
import { SP500Service } from '@/services/sp500-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'current';
    
    switch (action) {
      case 'current':
        const currentPrice = await SP500Service.getCurrentSP500Price();
        return NextResponse.json({ price: currentPrice });
        
      case 'historical':
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'startDate and endDate are required' },
            { status: 400 }
          );
        }
        
        const historicalData = await SP500Service.getSP500DataForPeriod(startDate, endDate);
        return NextResponse.json(historicalData);
        
      case 'return':
        const returnStartDate = searchParams.get('startDate');
        const returnEndDate = searchParams.get('endDate');
        
        if (!returnStartDate || !returnEndDate) {
          return NextResponse.json(
            { error: 'startDate and endDate are required' },
            { status: 400 }
          );
        }
        
        const returnData = await SP500Service.calculateSP500Return(returnStartDate, returnEndDate);
        return NextResponse.json({ return: returnData });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: current, historical, or return' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in SP500 API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch S&P 500 data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 