import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SP500Service } from '@/services/sp500-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // all, month, quarter, year
    const ticker = searchParams.get('ticker');

    // Build date filter based on period
    let dateFilter = {};
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (period !== 'all') {
      const now = new Date();
      startDate = new Date();
      
      switch (period) {
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      endDate = now;
      dateFilter = {
        entryDate: {
          gte: startDate.toISOString()
        }
      };
    }

    // Build ticker filter
    const tickerFilter = ticker ? { ticker } : {};

    // Get all trades with filters
    const trades = await prisma.trade.findMany({
      where: {
        ...dateFilter,
        ...tickerFilter
      },
      orderBy: {
        entryDate: 'desc'
      }
    });

    // Calculate performance metrics
    const closedTrades = trades.filter(trade => trade.exitDate && trade.exitPrice);
    const openTrades = trades.filter(trade => !trade.exitDate);

    // Helper function to safely get fees
    const getFees = (trade: any) => trade.fees || 0;

    // Helper function to ensure valid numbers
    const ensureNumber = (value: any, defaultValue: number = 0): number => {
      if (value === undefined || value === null || isNaN(value)) {
        return defaultValue;
      }
      return Number(value);
    };

    // Total P&L calculation
    const totalPnL = closedTrades.reduce((sum: number, trade: any) => {
      const grossPnL = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return sum + grossPnL - getFees(trade);
    }, 0);

    // Calculate total portfolio value for return calculation
    const totalPortfolioValue = closedTrades.reduce((sum: number, trade: any) => {
      return sum + (trade.entryPrice * trade.quantity);
    }, 0);

    // Calculate portfolio return percentage
    const portfolioReturnPercentage = ensureNumber(totalPortfolioValue > 0 ? (totalPnL / totalPortfolioValue) * 100 : 0);

    // Calculate S&P 500 comparison for the same period
    let sp500Comparison = null;
    if (closedTrades.length > 0) {
      try {
        // Find the earliest entry date and latest exit date for the period
        const entryDates = closedTrades.map(trade => new Date(trade.entryDate));
        const exitDates = closedTrades.map(trade => new Date(trade.exitDate!));
        
        const earliestEntry = new Date(Math.min(...entryDates.map(d => d.getTime())));
        const latestExit = new Date(Math.max(...exitDates.map(d => d.getTime())));
        
        // Use period dates if available, otherwise use trade date range
        const comparisonStartDate = startDate || earliestEntry;
        const comparisonEndDate = endDate || latestExit;
        
        const sp500Return = await SP500Service.calculateSP500Return(
          comparisonStartDate.toISOString().split('T')[0],
          comparisonEndDate.toISOString().split('T')[0]
        );
        
        const alpha = portfolioReturnPercentage - sp500Return;
        
        sp500Comparison = {
          portfolioReturn: ensureNumber(portfolioReturnPercentage),
          sp500Return: ensureNumber(sp500Return),
          alpha: ensureNumber(alpha),
          outperformance: alpha > 0,
          startDate: comparisonStartDate.toISOString().split('T')[0],
          endDate: comparisonEndDate.toISOString().split('T')[0],
          period: period === 'all' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)
        };
      } catch (error) {
        console.error('Error calculating S&P 500 comparison:', error);
        // Continue without S&P 500 comparison if there's an error
      }
    }

    // Win rate calculation
    const winningTrades = closedTrades.filter((trade: any) => {
      const grossPnL = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return grossPnL - getFees(trade) > 0;
    });

    const winRate = ensureNumber(closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0);

    // Average return per trade
    const averageReturn = ensureNumber(closedTrades.length > 0 ? totalPnL / closedTrades.length : 0);

    // Total volume
    const totalVolume = trades.reduce((sum: number, trade: any) => sum + (trade.entryPrice * trade.quantity), 0);

    // Average holding period
    const holdingPeriods = closedTrades.map((trade: any) => {
      const entry = new Date(trade.entryDate);
      const exit = new Date(trade.exitDate!);
      return Math.ceil((exit.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
    });

    const averageHoldingPeriod = ensureNumber(holdingPeriods.length > 0 
      ? holdingPeriods.reduce((sum: number, days: number) => sum + days, 0) / holdingPeriods.length 
      : 0);

    // Best and worst trades
    const bestTrade = closedTrades.reduce((best: any, trade: any) => {
      const grossPnL = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      const netPnL = grossPnL - getFees(trade);
      
      if (!best || netPnL > (best.isShort 
        ? (best.entryPrice - best.exitPrice!) * best.quantity - getFees(best)
        : (best.exitPrice! - best.entryPrice) * best.quantity - getFees(best))) {
        return trade;
      }
      return best;
    }, null);

    const worstTrade = closedTrades.reduce((worst: any, trade: any) => {
      const grossPnL = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      const netPnL = grossPnL - getFees(trade);
      
      if (!worst || netPnL < (worst.isShort 
        ? (worst.entryPrice - worst.exitPrice!) * worst.quantity - getFees(worst)
        : (worst.exitPrice! - worst.entryPrice) * worst.quantity - getFees(worst))) {
        return trade;
      }
      return worst;
    }, null);

    // Monthly performance breakdown
    const monthlyPerformance = closedTrades.reduce((acc: Record<string, { pnl: number; trades: number; wins: number }>, trade: any) => {
      const exitDate = new Date(trade.exitDate!);
      const monthKey = `${exitDate.getFullYear()}-${String(exitDate.getMonth() + 1).padStart(2, '0')}`;
      
      const grossPnL = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      const netPnL = grossPnL - getFees(trade);

      if (!acc[monthKey]) {
        acc[monthKey] = { pnl: 0, trades: 0, wins: 0 };
      }
      
      acc[monthKey].pnl += netPnL;
      acc[monthKey].trades += 1;
      if (netPnL > 0) acc[monthKey].wins += 1;
      
      return acc;
    }, {} as Record<string, { pnl: number; trades: number; wins: number }>);

    // Ticker performance breakdown
    const tickerPerformance = closedTrades.reduce((acc: Record<string, { pnl: number; trades: number; wins: number; volume: number }>, trade: any) => {
      if (!acc[trade.ticker]) {
        acc[trade.ticker] = { pnl: 0, trades: 0, wins: 0, volume: 0 };
      }
      
      const grossPnL = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      const netPnL = grossPnL - getFees(trade);

      acc[trade.ticker].pnl += netPnL;
      acc[trade.ticker].trades += 1;
      acc[trade.ticker].volume += trade.entryPrice * trade.quantity;
      if (netPnL > 0) acc[trade.ticker].wins += 1;
      
      return acc;
    }, {} as Record<string, { pnl: number; trades: number; wins: number; volume: number }>);

    // Position type performance
    const longTrades = closedTrades.filter((trade: any) => !trade.isShort);
    const shortTrades = closedTrades.filter((trade: any) => trade.isShort);

    const longPnL = longTrades.reduce((sum: number, trade: any) => {
      const grossPnL = (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return sum + grossPnL - (trade.fees || 0);
    }, 0);

    const shortPnL = shortTrades.reduce((sum: number, trade: any) => {
      const grossPnL = (trade.entryPrice - trade.exitPrice!) * trade.quantity;
      return sum + grossPnL - getFees(trade);
    }, 0);

    const longWinRate = ensureNumber(longTrades.length > 0 
      ? (longTrades.filter((trade: any) => {
          const grossPnL = (trade.exitPrice! - trade.entryPrice) * trade.quantity;
          return grossPnL - getFees(trade) > 0;
        }).length / longTrades.length) * 100 
      : 0);

    const shortWinRate = ensureNumber(shortTrades.length > 0 
      ? (shortTrades.filter((trade: any) => {
          const grossPnL = (trade.entryPrice - trade.exitPrice!) * trade.quantity;
          return grossPnL - getFees(trade) > 0;
        }).length / shortTrades.length) * 100 
      : 0);

    const performanceData = {
      summary: {
        totalTrades: ensureNumber(trades.length),
        openTrades: ensureNumber(openTrades.length),
        closedTrades: ensureNumber(closedTrades.length),
        totalPnL: ensureNumber(totalPnL),
        winRate: ensureNumber(winRate),
        averageReturn: ensureNumber(averageReturn),
        totalVolume: ensureNumber(totalVolume),
        averageHoldingPeriod: ensureNumber(averageHoldingPeriod),
        portfolioReturn: ensureNumber(portfolioReturnPercentage)
      },
      bestTrade: bestTrade ? {
        id: bestTrade.id,
        ticker: bestTrade.ticker,
        pnl: (bestTrade.isShort 
          ? (bestTrade.entryPrice - bestTrade.exitPrice!) * bestTrade.quantity
          : (bestTrade.exitPrice! - bestTrade.entryPrice) * bestTrade.quantity) - getFees(bestTrade),
        entryDate: bestTrade.entryDate,
        exitDate: bestTrade.exitDate
      } : null,
      worstTrade: worstTrade ? {
        id: worstTrade.id,
        ticker: worstTrade.ticker,
        pnl: (worstTrade.isShort 
          ? (worstTrade.entryPrice - worstTrade.exitPrice!) * worstTrade.quantity
          : (worstTrade.exitPrice! - worstTrade.entryPrice) * worstTrade.quantity) - getFees(worstTrade),
        entryDate: worstTrade.entryDate,
        exitDate: worstTrade.exitDate
      } : null,
      monthlyPerformance,
      tickerPerformance,
      positionTypePerformance: {
        long: {
          trades: ensureNumber(longTrades.length),
          pnl: ensureNumber(longPnL),
          winRate: ensureNumber(longWinRate)
        },
        short: {
          trades: ensureNumber(shortTrades.length),
          pnl: ensureNumber(shortPnL),
          winRate: ensureNumber(shortWinRate)
        }
      },
      sp500Comparison,
      filters: {
        period,
        ticker: ticker || 'all'
      }
    };

    return NextResponse.json(performanceData);
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance analytics' },
      { status: 500 }
    );
  }
} 