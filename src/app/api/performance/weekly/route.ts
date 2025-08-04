import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { performanceAnalysisService } from '@/services/performance-analysis-service';
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
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const ticker = searchParams.get('ticker');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 52; // Default to 52 weeks

    // Validate year parameter
    if (year < 2000 || year > new Date().getFullYear() + 1) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      );
    }

    // Build filters
    const whereClause: any = {
      userId: userId, // Add user ID filter
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

    // Calculate weekly performance using the service
    const weeklyPerformance = performanceAnalysisService.getWeeklyPerformance(trades as any, year);

    // Apply limit if specified
    const limitedResults = limit > 0 ? weeklyPerformance.slice(-limit) : weeklyPerformance;

    // Calculate summary statistics
    const totalPnL = limitedResults.reduce((sum, week) => sum + week.totalPnL, 0);
    const totalTrades = limitedResults.reduce((sum, week) => sum + week.totalTrades, 0);
    const totalWinningTrades = limitedResults.reduce((sum, week) => sum + week.winningTrades, 0);
    const overallWinRate = totalTrades > 0 ? (totalWinningTrades / totalTrades) * 100 : 0;
    const averageWeeklyReturn = limitedResults.length > 0 ? totalPnL / limitedResults.length : 0;
    
    const winningWeeks = limitedResults.filter(week => week.totalPnL > 0).length;
    const weeklyWinRate = limitedResults.length > 0 ? (winningWeeks / limitedResults.length) * 100 : 0;
    
    const bestWeek = limitedResults.length > 0 ? 
      limitedResults.reduce((best, week) => week.totalPnL > best.totalPnL ? week : best) : null;
    
    const worstWeek = limitedResults.length > 0 ? 
      limitedResults.reduce((worst, week) => week.totalPnL < worst.totalPnL ? week : worst) : null;

    // Calculate consistency metrics
    const weeklyReturns = limitedResults.map(week => week.totalPnL);
    const averageReturn = weeklyReturns.length > 0 ? weeklyReturns.reduce((sum, ret) => sum + ret, 0) / weeklyReturns.length : 0;
    const variance = weeklyReturns.length > 1 ? 
      weeklyReturns.reduce((sum, ret) => sum + Math.pow(ret - averageReturn, 2), 0) / (weeklyReturns.length - 1) : 0;
    const standardDeviation = Math.sqrt(variance);
    const sharpeRatio = standardDeviation > 0 ? averageReturn / standardDeviation : 0;

    const response = {
      year,
      ticker: ticker || 'all',
      summary: {
        totalWeeks: limitedResults.length,
        totalPnL,
        totalTrades,
        totalWinningTrades,
        overallWinRate,
        weeklyWinRate,
        averageWeeklyReturn,
        bestWeek: bestWeek ? {
          week: bestWeek.week,
          pnl: bestWeek.totalPnL,
          trades: bestWeek.totalTrades,
          startDate: bestWeek.startDate,
          endDate: bestWeek.endDate
        } : null,
        worstWeek: worstWeek ? {
          week: worstWeek.week,
          pnl: worstWeek.totalPnL,
          trades: worstWeek.totalTrades,
          startDate: worstWeek.startDate,
          endDate: worstWeek.endDate
        } : null,
        volatility: standardDeviation,
        sharpeRatio
      },
      weeks: limitedResults.map(week => ({
        ...week,
        startDate: week.startDate.toISOString(),
        endDate: week.endDate.toISOString()
      })),
      metadata: {
        generatedAt: new Date().toISOString(),
        dataPoints: limitedResults.length,
        filters: { year, ticker, limit }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching weekly performance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch weekly performance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 