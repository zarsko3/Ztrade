import { Trade } from '@/types/trade';
import { startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear, differenceInDays, format } from 'date-fns';

export interface PerformanceMetrics {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  totalPnL: number;
  winRate: number;
  profitFactor: number;
  averageReturn: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  totalVolume: number;
  averageHoldingPeriod: number;
  sharpeRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
}

export interface PeriodPerformance {
  period: string;
  startDate: Date;
  endDate: Date;
  metrics: PerformanceMetrics;
  trades: Trade[];
  dailyReturns: { date: string; return: number; cumulative: number }[];
}

export interface TickerPerformance {
  ticker: string;
  totalPnL: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageReturn: number;
  totalVolume: number;
  bestTrade: number;
  worstTrade: number;
}

export interface MonthlyPerformance {
  month: string;
  year: number;
  totalPnL: number;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  averageReturn: number;
}

export interface WeeklyPerformance {
  week: string;
  year: number;
  startDate: Date;
  endDate: Date;
  totalPnL: number;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  averageReturn: number;
}

export interface YearlyPerformance {
  year: number;
  totalPnL: number;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  averageReturn: number;
  monthlyBreakdown: MonthlyPerformance[];
}

class PerformanceAnalysisService {
  private calculateTradePnL(trade: Trade): number {
    if (!trade.exitDate || !trade.exitPrice) return 0;
    
    const grossPnL = trade.isShort 
      ? (trade.entryPrice - trade.exitPrice) * trade.quantity
      : (trade.exitPrice - trade.entryPrice) * trade.quantity;
    
    return grossPnL - (trade.fees || 0);
  }

  private isWinningTrade(trade: Trade): boolean {
    return this.calculateTradePnL(trade) > 0;
  }

  private calculateHoldingPeriod(trade: Trade): number {
    if (!trade.exitDate) return 0;
    const entryDate = typeof trade.entryDate === 'string' ? new Date(trade.entryDate) : trade.entryDate;
    const exitDate = typeof trade.exitDate === 'string' ? new Date(trade.exitDate) : trade.exitDate;
    return differenceInDays(exitDate, entryDate);
  }

  calculatePerformanceMetrics(trades: Trade[]): PerformanceMetrics {
    const closedTrades = trades.filter(trade => trade.exitDate && trade.exitPrice);
    const openTrades = trades.filter(trade => !trade.exitDate);

    // Basic metrics
    const totalTrades = trades.length;
    const closedTradesCount = closedTrades.length;
    const openTradesCount = openTrades.length;

    // P&L calculations
    const tradePnLs = closedTrades.map(trade => this.calculateTradePnL(trade));
    const totalPnL = tradePnLs.reduce((sum, pnl) => sum + pnl, 0);
    
    const winningTrades = tradePnLs.filter(pnl => pnl > 0);
    const losingTrades = tradePnLs.filter(pnl => pnl < 0);
    
    const winRate = closedTradesCount > 0 ? (winningTrades.length / closedTradesCount) * 100 : 0;
    const averageReturn = closedTradesCount > 0 ? totalPnL / closedTradesCount : 0;
    
    // Win/Loss analysis
    const averageWin = winningTrades.length > 0 ? winningTrades.reduce((sum, pnl) => sum + pnl, 0) / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, pnl) => sum + pnl, 0)) / losingTrades.length : 0;
    
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.abs(Math.min(...losingTrades)) : 0;
    
    // Profit factor
    const totalWins = winningTrades.reduce((sum, pnl) => sum + pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, pnl) => sum + pnl, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    
    // Volume and holding period
    const totalVolume = trades.reduce((sum, trade) => sum + (trade.entryPrice * trade.quantity), 0);
    const holdingPeriods = closedTrades.map(trade => this.calculateHoldingPeriod(trade));
    const averageHoldingPeriod = holdingPeriods.length > 0 ? holdingPeriods.reduce((sum, days) => sum + days, 0) / holdingPeriods.length : 0;
    
    // Risk metrics (simplified calculations)
    const returns = tradePnLs.map(pnl => totalVolume > 0 ? (pnl / totalVolume) * 100 : 0);
    const averageReturnPct = returns.length > 0 ? returns.reduce((sum, ret) => sum + ret, 0) / returns.length : 0;
    const returnStdDev = returns.length > 1 ? Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - averageReturnPct, 2), 0) / (returns.length - 1)) : 0;
    const sharpeRatio = returnStdDev > 0 ? averageReturnPct / returnStdDev : 0;
    
    // Max drawdown calculation
    let maxDrawdown = 0;
    let peak = 0;
    let cumulative = 0;
    
    for (const pnl of tradePnLs) {
      cumulative += pnl;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    const calmarRatio = maxDrawdown > 0 ? (totalPnL / maxDrawdown) : 0;

    return {
      totalTrades,
      openTrades: openTradesCount,
      closedTrades: closedTradesCount,
      totalPnL,
      winRate,
      profitFactor,
      averageReturn,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      totalVolume,
      averageHoldingPeriod,
      sharpeRatio,
      maxDrawdown,
      calmarRatio
    };
  }

  getWeeklyPerformance(trades: Trade[], year?: number): WeeklyPerformance[] {
    const targetYear = year || new Date().getFullYear();
    const weeklyData: Map<string, Trade[]> = new Map();
    
    trades.forEach(trade => {
      const exitDate = trade.exitDate ? (typeof trade.exitDate === 'string' ? new Date(trade.exitDate) : trade.exitDate) : null;
      if (!exitDate || exitDate.getFullYear() !== targetYear) return;
      
      const weekStart = startOfWeek(exitDate);
      const weekKey = format(weekStart, 'yyyy-ww');
      
      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, []);
      }
      weeklyData.get(weekKey)!.push(trade);
    });
    
    return Array.from(weeklyData.entries()).map(([weekKey, weekTrades]) => {
      const weekStart = startOfWeek(new Date(weekTrades[0].exitDate!));
      const weekEnd = endOfWeek(weekStart);
      
      const totalPnL = weekTrades.reduce((sum, trade) => sum + this.calculateTradePnL(trade), 0);
      const winningTrades = weekTrades.filter(trade => this.isWinningTrade(trade)).length;
      const winRate = weekTrades.length > 0 ? (winningTrades / weekTrades.length) * 100 : 0;
      const averageReturn = weekTrades.length > 0 ? totalPnL / weekTrades.length : 0;
      
      return {
        week: weekKey,
        year: targetYear,
        startDate: weekStart,
        endDate: weekEnd,
        totalPnL,
        totalTrades: weekTrades.length,
        winningTrades,
        winRate,
        averageReturn
      };
    }).sort((a, b) => a.week.localeCompare(b.week));
  }

  getMonthlyPerformance(trades: Trade[], year?: number): MonthlyPerformance[] {
    const targetYear = year || new Date().getFullYear();
    const monthlyData: Map<string, Trade[]> = new Map();
    
    trades.forEach(trade => {
      const exitDate = trade.exitDate ? (typeof trade.exitDate === 'string' ? new Date(trade.exitDate) : trade.exitDate) : null;
      if (!exitDate || exitDate.getFullYear() !== targetYear) return;
      
      const monthKey = format(exitDate, 'yyyy-MM');
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, []);
      }
      monthlyData.get(monthKey)!.push(trade);
    });
    
    return Array.from(monthlyData.entries()).map(([monthKey, monthTrades]) => {
      const totalPnL = monthTrades.reduce((sum, trade) => sum + this.calculateTradePnL(trade), 0);
      const winningTrades = monthTrades.filter(trade => this.isWinningTrade(trade)).length;
      const winRate = monthTrades.length > 0 ? (winningTrades / monthTrades.length) * 100 : 0;
      const averageReturn = monthTrades.length > 0 ? totalPnL / monthTrades.length : 0;
      
      return {
        month: monthKey,
        year: targetYear,
        totalPnL,
        totalTrades: monthTrades.length,
        winningTrades,
        winRate,
        averageReturn
      };
    }).sort((a, b) => a.month.localeCompare(b.month));
  }

  getYearlyPerformance(trades: Trade[]): YearlyPerformance[] {
    const yearlyData: Map<number, Trade[]> = new Map();
    
    trades.forEach(trade => {
      const exitDate = trade.exitDate ? (typeof trade.exitDate === 'string' ? new Date(trade.exitDate) : trade.exitDate) : null;
      if (!exitDate) return;
      
      const year = exitDate.getFullYear();
      
      if (!yearlyData.has(year)) {
        yearlyData.set(year, []);
      }
      yearlyData.get(year)!.push(trade);
    });
    
    return Array.from(yearlyData.entries()).map(([year, yearTrades]) => {
      const totalPnL = yearTrades.reduce((sum, trade) => sum + this.calculateTradePnL(trade), 0);
      const winningTrades = yearTrades.filter(trade => this.isWinningTrade(trade)).length;
      const winRate = yearTrades.length > 0 ? (winningTrades / yearTrades.length) * 100 : 0;
      const averageReturn = yearTrades.length > 0 ? totalPnL / yearTrades.length : 0;
      
      const monthlyBreakdown = this.getMonthlyPerformance(yearTrades, year);
      
      return {
        year,
        totalPnL,
        totalTrades: yearTrades.length,
        winningTrades,
        winRate,
        averageReturn,
        monthlyBreakdown
      };
    }).sort((a, b) => a.year - b.year);
  }

  getTickerPerformance(trades: Trade[]): TickerPerformance[] {
    const tickerData: Map<string, Trade[]> = new Map();
    
    trades.forEach(trade => {
      if (!tickerData.has(trade.ticker)) {
        tickerData.set(trade.ticker, []);
      }
      tickerData.get(trade.ticker)!.push(trade);
    });
    
    return Array.from(tickerData.entries()).map(([ticker, tickerTrades]) => {
      const closedTrades = tickerTrades.filter(trade => trade.exitDate && trade.exitPrice);
      const tradePnLs = closedTrades.map(trade => this.calculateTradePnL(trade));
      
      const totalPnL = tradePnLs.reduce((sum, pnl) => sum + pnl, 0);
      const winningTrades = tradePnLs.filter(pnl => pnl > 0).length;
      const losingTrades = tradePnLs.filter(pnl => pnl < 0).length;
      const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;
      const averageReturn = closedTrades.length > 0 ? totalPnL / closedTrades.length : 0;
      const totalVolume = tickerTrades.reduce((sum, trade) => sum + (trade.entryPrice * trade.quantity), 0);
      const bestTrade = tradePnLs.length > 0 ? Math.max(...tradePnLs) : 0;
      const worstTrade = tradePnLs.length > 0 ? Math.min(...tradePnLs) : 0;
      
      return {
        ticker,
        totalPnL,
        totalTrades: tickerTrades.length,
        winningTrades,
        losingTrades,
        winRate,
        averageReturn,
        totalVolume,
        bestTrade,
        worstTrade
      };
    }).sort((a, b) => b.totalPnL - a.totalPnL);
  }

  getPeriodPerformance(trades: Trade[], period: 'week' | 'month' | 'year', startDate?: Date, endDate?: Date): PeriodPerformance {
    let periodStart: Date;
    let periodEnd: Date;
    let periodName: string;
    
    if (startDate && endDate) {
      periodStart = startDate;
      periodEnd = endDate;
      periodName = `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
    } else {
      const now = new Date();
      switch (period) {
        case 'week':
          periodStart = startOfWeek(now);
          periodEnd = endOfWeek(now);
          periodName = `Week of ${format(periodStart, 'MMM dd, yyyy')}`;
          break;
        case 'month':
          periodStart = startOfMonth(now);
          periodEnd = endOfMonth(now);
          periodName = format(now, 'MMMM yyyy');
          break;
        case 'year':
          periodStart = startOfYear(now);
          periodEnd = endOfYear(now);
          periodName = format(now, 'yyyy');
          break;
      }
    }
    
    const periodTrades = trades.filter(trade => {
      const tradeDate = trade.exitDate || trade.entryDate;
      const date = typeof tradeDate === 'string' ? new Date(tradeDate) : tradeDate;
      return date >= periodStart && date <= periodEnd;
    });
    
    const metrics = this.calculatePerformanceMetrics(periodTrades);
    
    // Generate daily returns for the period
    const dailyReturns = this.generateDailyReturns(periodTrades, periodStart, periodEnd);
    
    return {
      period: periodName,
      startDate: periodStart,
      endDate: periodEnd,
      metrics,
      trades: periodTrades,
      dailyReturns
    };
  }

  private generateDailyReturns(trades: Trade[], startDate: Date, endDate: Date): { date: string; return: number; cumulative: number }[] {
    const dailyData: Map<string, number> = new Map();
    const closedTrades = trades.filter(trade => trade.exitDate && trade.exitPrice);
    
    // Group trades by exit date and calculate daily returns
    closedTrades.forEach(trade => {
      const exitDate = typeof trade.exitDate === 'string' ? new Date(trade.exitDate) : trade.exitDate!;
      const dateKey = format(exitDate, 'yyyy-MM-dd');
      const pnl = this.calculateTradePnL(trade);
      
      dailyData.set(dateKey, (dailyData.get(dateKey) || 0) + pnl);
    });
    
    // Generate array with all dates in range
    const results: { date: string; return: number; cumulative: number }[] = [];
    let cumulative = 0;
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dailyReturn = dailyData.get(dateKey) || 0;
      cumulative += dailyReturn;
      
      results.push({
        date: dateKey,
        return: dailyReturn,
        cumulative
      });
    }
    
    return results;
  }
}

export const performanceAnalysisService = new PerformanceAnalysisService(); 