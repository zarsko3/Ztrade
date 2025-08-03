import { NextRequest, NextResponse } from 'next/server';
import { MachineLearningService } from '@/services/ai/machine-learning';

const mlService = new MachineLearningService();

export interface StrategiesResponse {
  strategies: any[];
  summary: {
    totalStrategies: number;
    activeStrategies: number;
    averageReturn: number;
    bestStrategy: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategyId = searchParams.get('strategyId');
    const action = searchParams.get('action');

    if (action === 'backtest' && strategyId) {
      // Perform backtest
      const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = searchParams.get('endDate') || new Date().toISOString();
      const symbols = searchParams.get('symbols')?.split(',') || ['AAPL', 'GOOGL', 'MSFT'];

      const backtestResult = await mlService.backtestStrategy(strategyId, startDate, endDate, symbols);
      
      return NextResponse.json({
        status: 'success',
        data: { backtestResult }
      });
    }

    if (strategyId) {
      // Get specific strategy
      const strategies = mlService.getStrategies();
      const strategy = strategies.find(s => s.id === strategyId);
      
      if (!strategy) {
        return NextResponse.json(
          { error: 'Strategy not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        status: 'success',
        data: { strategy }
      });
    }

    // Get all strategies
    const strategies = mlService.getStrategies();
    
    const summary = {
      totalStrategies: strategies.length,
      activeStrategies: strategies.filter(s => s.status === 'active').length,
      averageReturn: strategies.length > 0 
        ? strategies.reduce((sum, s) => sum + s.performance.totalReturn, 0) / strategies.length 
        : 0,
      bestStrategy: strategies.length > 0 
        ? strategies.reduce((best, current) => 
            current.performance.totalReturn > best.performance.totalReturn ? current : best
          ).name 
        : 'None'
    };

    return NextResponse.json({
      status: 'success',
      data: {
        strategies,
        summary
      }
    });

  } catch (error) {
    console.error('Error fetching trading strategies:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch trading strategies',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'create':
        const { name, description, type, parameters } = params;
        if (!name || !description || !type) {
          return NextResponse.json(
            { error: 'name, description, and type are required for creating strategy' },
            { status: 400 }
          );
        }

        const strategy = await mlService.createStrategy(name, description, type, parameters || {});
        return NextResponse.json({
          status: 'success',
          data: { strategy },
          message: 'Strategy created successfully'
        });

      case 'backtest':
        const { strategyId, startDate, endDate, symbols } = params;
        if (!strategyId) {
          return NextResponse.json(
            { error: 'strategyId is required for backtesting' },
            { status: 400 }
          );
        }

        const backtestResult = await mlService.backtestStrategy(
          strategyId, 
          startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate || new Date().toISOString(),
          symbols || ['AAPL', 'GOOGL', 'MSFT']
        );

        return NextResponse.json({
          status: 'success',
          data: { backtestResult },
          message: 'Backtest completed successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: create, backtest' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in trading strategy operation:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to perform trading strategy operation',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 