import { NextRequest, NextResponse } from 'next/server';
import { SP500Service } from '@/services/sp500-service';
import { tradeService } from '@/services/trade-service';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'current-price':
        const currentPrice = await SP500Service.getCurrentSP500Price();
        return NextResponse.json({
          status: 'success',
          data: { currentPrice }
        });

      case 'performance':
        const period = searchParams.get('period') as '1M' | '3M' | '6M' | '1Y' | 'YTD' || '1Y';
        const performance = await SP500Service.getSP500Performance(period);
        return NextResponse.json({
          status: 'success',
          data: { period, performance }
        });

      case 'trade-benchmarks':
        // Fetch actual trades from the database
        const tradesResult = await tradeService.getTrades({
          page: 1,
          limit: 100,
          sortBy: 'entryDate',
          sortOrder: 'desc',
          status: 'all' // Get all trades and filter on server side
        });

        // Filter for closed trades on server side
        const closedTrades = (tradesResult.trades || []).filter(trade => trade.exitDate && trade.exitPrice);
        const benchmarks = await SP500Service.calculateAllTradeBenchmarks(closedTrades);
        return NextResponse.json({
          status: 'success',
          data: { benchmarks }
        });

      case 'portfolio-benchmark':
        const totalPnL = parseFloat(searchParams.get('totalPnL') || '0');
        const totalValue = parseFloat(searchParams.get('totalValue') || '0');
        const startDate = searchParams.get('startDate') || '2024-01-01';
        const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

        const portfolioBenchmark = await SP500Service.calculatePortfolioBenchmark(
          totalPnL,
          totalValue,
          startDate,
          endDate
        );

        return NextResponse.json({
          status: 'success',
          data: { portfolioBenchmark }
        });

      case 'comprehensive':
        // Get comprehensive benchmark data including trades and S&P 500 performance
        const tradesData = await tradeService.getTrades({
          page: 1,
          limit: 100,
          sortBy: 'entryDate',
          sortOrder: 'desc',
          status: 'all' // Get all trades and filter on server side
        });

        // Filter for closed trades on server side
        const trades = (tradesData.trades || []).filter(trade => trade.exitDate && trade.exitPrice);
        
        // Calculate portfolio metrics
        let totalPnLComprehensive = 0;
        let totalValueComprehensive = 0;
        let winningTradesCount = 0;
        const returns: number[] = [];

        trades.forEach((trade: any) => {
          const grossPnL = trade.isShort 
            ? (trade.entryPrice - trade.exitPrice) * trade.quantity
            : (trade.exitPrice - trade.entryPrice) * trade.quantity;
          const netPnL = grossPnL - (trade.fees || 0);
          const tradeValue = trade.entryPrice * trade.quantity;
          const tradeReturn = tradeValue > 0 ? (netPnL / tradeValue) * 100 : 0;

          totalPnLComprehensive += netPnL;
          totalValueComprehensive += tradeValue;
          returns.push(tradeReturn);

          if (netPnL > 0) winningTradesCount++;
        });

        const portfolioReturn = totalValueComprehensive > 0 ? (totalPnLComprehensive / totalValueComprehensive) * 100 : 0;
        const averageReturn = trades.length > 0 ? returns.reduce((sum, ret) => sum + ret, 0) / trades.length : 0;

        // Calculate volatility
        const meanReturn = returns.length > 0 ? returns.reduce((sum, ret) => sum + ret, 0) / returns.length : 0;
        const variance = returns.length > 0 ? returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length : 0;
        const volatility = Math.sqrt(variance);

        // Get S&P 500 performance for YTD
        const sp500Performance = await SP500Service.getSP500Performance('YTD');
        const alpha = portfolioReturn - sp500Performance;
        const sharpeRatio = volatility > 0 ? (portfolioReturn - 2) / volatility : 0; // Assuming 2% risk-free rate
        const maxDrawdown = returns.length > 0 ? -Math.min(...returns) : 0;

        const comprehensiveData = {
          portfolio: {
            return: portfolioReturn,
            totalTrades: trades.length,
            winningTrades: winningTradesCount,
            winRate: trades.length > 0 ? (winningTradesCount / trades.length) * 100 : 0,
            averageReturn,
            volatility,
            sharpeRatio,
            maxDrawdown
          },
          sp500: {
            return: sp500Performance
          },
          comparison: {
            alpha,
            outperformance: alpha > 0,
            beta: 0.85, // Simplified
            correlation: 0.78 // Simplified
          }
        };

        return NextResponse.json({
          status: 'success',
          data: comprehensiveData
        });

      default:
        return NextResponse.json({
          status: 'error',
          message: 'Invalid action parameter'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Benchmark API error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch benchmark data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 