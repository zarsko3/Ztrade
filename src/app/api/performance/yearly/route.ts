import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { performanceAnalysisService } from '@/services/performance-analysis-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const startYear = searchParams.get('startYear') ? parseInt(searchParams.get('startYear')!) : 2020;
    const endYear = searchParams.get('endYear') ? parseInt(searchParams.get('endYear')!) : new Date().getFullYear();
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10; // Default to 10 years

    // Validate year parameters
    if (startYear < 2000 || endYear > new Date().getFullYear() + 1 || startYear > endYear) {
      return NextResponse.json(
        { error: 'Invalid year parameters' },
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
            gte: new Date(`${startYear}-01-01`).toISOString(),
          },
        },
        {
          exitDate: {
            lt: new Date(`${endYear + 1}-01-01`).toISOString(),
          },
        },
      ],
    };

    if (ticker) {
      whereClause.ticker = ticker;
    }

    // Get all closed trades for the specified year range
    const trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: {
        exitDate: 'asc',
      },
    });

    // Calculate yearly performance using the service
    const yearlyPerformance = performanceAnalysisService.getYearlyPerformance(trades as any);

    // Filter by the requested year range
    const filteredResults = yearlyPerformance.filter(year => 
      year.year >= startYear && year.year <= endYear
    );

    // Apply limit if specified
    const limitedResults = limit > 0 ? filteredResults.slice(-limit) : filteredResults;

    // Calculate comprehensive summary statistics
    const totalPnL = limitedResults.reduce((sum, year) => sum + year.totalPnL, 0);
    const totalTrades = limitedResults.reduce((sum, year) => sum + year.totalTrades, 0);
    const totalWinningTrades = limitedResults.reduce((sum, year) => sum + year.winningTrades, 0);
    const overallWinRate = totalTrades > 0 ? (totalWinningTrades / totalTrades) * 100 : 0;
    const averageYearlyReturn = limitedResults.length > 0 ? totalPnL / limitedResults.length : 0;
    
    const profitableYears = limitedResults.filter(year => year.totalPnL > 0).length;
    const yearlyWinRate = limitedResults.length > 0 ? (profitableYears / limitedResults.length) * 100 : 0;
    
    const bestYear = limitedResults.length > 0 ? 
      limitedResults.reduce((best, year) => year.totalPnL > best.totalPnL ? year : best) : null;
    
    const worstYear = limitedResults.length > 0 ? 
      limitedResults.reduce((worst, year) => year.totalPnL < worst.totalPnL ? year : worst) : null;

    // Calculate advanced metrics
    const yearlyReturns = limitedResults.map(year => year.totalPnL);
    const averageReturn = yearlyReturns.length > 0 ? yearlyReturns.reduce((sum, ret) => sum + ret, 0) / yearlyReturns.length : 0;
    const variance = yearlyReturns.length > 1 ? 
      yearlyReturns.reduce((sum, ret) => sum + Math.pow(ret - averageReturn, 2), 0) / (yearlyReturns.length - 1) : 0;
    const standardDeviation = Math.sqrt(variance);
    
    // Calculate Sharpe ratio (simplified annual calculation)
    const sharpeRatio = standardDeviation > 0 ? averageReturn / standardDeviation : 0;
    
    // Calculate max drawdown on yearly basis
    let maxDrawdown = 0;
    let peak = 0;
    let cumulative = 0;
    
    for (const yearReturn of yearlyReturns) {
      cumulative += yearReturn;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Calculate year-over-year growth rates
    const yearlyGrowthRates = [];
    for (let i = 1; i < limitedResults.length; i++) {
      const current = limitedResults[i].totalPnL;
      const previous = limitedResults[i - 1].totalPnL;
      if (previous !== 0) {
        yearlyGrowthRates.push(((current - previous) / Math.abs(previous)) * 100);
      }
    }

    const averageGrowthRate = yearlyGrowthRates.length > 0 ? 
      yearlyGrowthRates.reduce((sum, rate) => sum + rate, 0) / yearlyGrowthRates.length : 0;

    // Calculate CAGR (Compound Annual Growth Rate)
    let cagr = 0;
    if (limitedResults.length > 1) {
      const initialValue = Math.abs(limitedResults[0].totalPnL) || 1000; // Use $1000 as base if first year has 0
      const finalValue = Math.abs(totalPnL) || 1;
      const years = limitedResults.length - 1;
      if (years > 0 && initialValue > 0) {
        cagr = (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
      }
    }

    // Calculate portfolio metrics
    const totalVolume = trades.reduce((sum, trade) => sum + (trade.entryPrice * trade.quantity), 0);
    const averageTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;

    // Calculate consistency score (percentage of profitable years)
    const consistencyScore = limitedResults.length > 0 ? (profitableYears / limitedResults.length) * 100 : 0;

    const response = {
      period: {
        startYear,
        endYear,
        totalYears: limitedResults.length
      },
      ticker: ticker || 'all',
      summary: {
        totalYears: limitedResults.length,
        totalPnL,
        totalTrades,
        totalWinningTrades,
        totalVolume,
        overallWinRate,
        yearlyWinRate,
        profitableYears,
        averageYearlyReturn,
        averageTradeSize,
        bestYear: bestYear ? {
          year: bestYear.year,
          pnl: bestYear.totalPnL,
          trades: bestYear.totalTrades,
          winRate: bestYear.winRate
        } : null,
        worstYear: worstYear ? {
          year: worstYear.year,
          pnl: worstYear.totalPnL,
          trades: worstYear.totalTrades,
          winRate: worstYear.winRate
        } : null,
        volatility: standardDeviation,
        sharpeRatio,
        maxDrawdown,
        averageGrowthRate,
        cagr,
        consistencyScore
      },
      years: limitedResults.map(year => ({
        ...year,
        monthlyBreakdown: year.monthlyBreakdown.map(month => ({
          ...month,
          monthName: new Date(`${month.year}-${month.month.split('-')[1]}-01`).toLocaleDateString('en-US', { month: 'long' })
        }))
      })),
      trends: {
        yearlyReturns: limitedResults.map(year => ({
          year: year.year,
          return: year.totalPnL,
          cumulative: limitedResults.slice(0, limitedResults.indexOf(year) + 1).reduce((sum, y) => sum + y.totalPnL, 0)
        })),
        growthRates: yearlyGrowthRates.map((rate, index) => ({
          year: limitedResults[index + 1].year,
          growthRate: rate
        }))
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dataPoints: limitedResults.length,
        filters: { startYear, endYear, ticker, limit }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching yearly performance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch yearly performance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 