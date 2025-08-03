import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { performanceAnalysisService } from '@/services/performance-analysis-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const ticker = searchParams.get('ticker');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 12; // Default to 12 months

    // Validate year parameter
    if (year < 2000 || year > new Date().getFullYear() + 1) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      );
    }

    // Build filters
    const whereClause: any = {
      exitDate: {
        not: null,
      },
      AND: [
        {
          exitDate: {
            gte: new Date(`${year}-01-01`).toISOString(),
          },
        },
        {
          exitDate: {
            lt: new Date(`${year + 1}-01-01`).toISOString(),
          },
        },
      ],
    };

    if (ticker) {
      whereClause.ticker = ticker;
    }

    // Get all closed trades for the specified year
    const trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: {
        exitDate: 'asc',
      },
    });

    // Calculate monthly performance using the service
    const monthlyPerformance = performanceAnalysisService.getMonthlyPerformance(trades as any, year);

    // Apply limit if specified
    const limitedResults = limit > 0 ? monthlyPerformance.slice(-limit) : monthlyPerformance;

    // Calculate summary statistics
    const totalPnL = limitedResults.reduce((sum, month) => sum + month.totalPnL, 0);
    const totalTrades = limitedResults.reduce((sum, month) => sum + month.totalTrades, 0);
    const totalWinningTrades = limitedResults.reduce((sum, month) => sum + month.winningTrades, 0);
    const overallWinRate = totalTrades > 0 ? (totalWinningTrades / totalTrades) * 100 : 0;
    const averageMonthlyReturn = limitedResults.length > 0 ? totalPnL / limitedResults.length : 0;
    
    const profitableMonths = limitedResults.filter(month => month.totalPnL > 0).length;
    const monthlyWinRate = limitedResults.length > 0 ? (profitableMonths / limitedResults.length) * 100 : 0;
    
    const bestMonth = limitedResults.length > 0 ? 
      limitedResults.reduce((best, month) => month.totalPnL > best.totalPnL ? month : best) : null;
    
    const worstMonth = limitedResults.length > 0 ? 
      limitedResults.reduce((worst, month) => month.totalPnL < worst.totalPnL ? month : worst) : null;

    // Calculate consistency metrics
    const monthlyReturns = limitedResults.map(month => month.totalPnL);
    const averageReturn = monthlyReturns.length > 0 ? monthlyReturns.reduce((sum, ret) => sum + ret, 0) / monthlyReturns.length : 0;
    const variance = monthlyReturns.length > 1 ? 
      monthlyReturns.reduce((sum, ret) => sum + Math.pow(ret - averageReturn, 2), 0) / (monthlyReturns.length - 1) : 0;
    const standardDeviation = Math.sqrt(variance);
    
    // Calculate Sharpe ratio (simplified)
    const sharpeRatio = standardDeviation > 0 ? averageReturn / standardDeviation : 0;
    
    // Calculate max drawdown on monthly basis
    let maxDrawdown = 0;
    let peak = 0;
    let cumulative = 0;
    
    for (const monthReturn of monthlyReturns) {
      cumulative += monthReturn;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Calculate month-over-month growth rates
    const monthlyGrowthRates = [];
    for (let i = 1; i < limitedResults.length; i++) {
      const current = limitedResults[i].totalPnL;
      const previous = limitedResults[i - 1].totalPnL;
      if (previous !== 0) {
        monthlyGrowthRates.push(((current - previous) / Math.abs(previous)) * 100);
      }
    }

    const averageGrowthRate = monthlyGrowthRates.length > 0 ? 
      monthlyGrowthRates.reduce((sum, rate) => sum + rate, 0) / monthlyGrowthRates.length : 0;

    const response = {
      year,
      ticker: ticker || 'all',
      summary: {
        totalMonths: limitedResults.length,
        totalPnL,
        totalTrades,
        totalWinningTrades,
        overallWinRate,
        monthlyWinRate,
        profitableMonths,
        averageMonthlyReturn,
        bestMonth: bestMonth ? {
          month: bestMonth.month,
          pnl: bestMonth.totalPnL,
          trades: bestMonth.totalTrades,
          winRate: bestMonth.winRate
        } : null,
        worstMonth: worstMonth ? {
          month: worstMonth.month,
          pnl: worstMonth.totalPnL,
          trades: worstMonth.totalTrades,
          winRate: worstMonth.winRate
        } : null,
        volatility: standardDeviation,
        sharpeRatio,
        maxDrawdown,
        averageGrowthRate
      },
      months: limitedResults,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataPoints: limitedResults.length,
        filters: { year, ticker, limit }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching monthly performance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch monthly performance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 