import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

export interface ExportOptions {
  type: 'trades' | 'performance' | 'analytics';
  dateRange?: {
    start: Date;
    end: Date;
  };
  ticker?: string;
  includeOpenPositions?: boolean;
  format?: 'xlsx' | 'csv';
}

export interface TradeExportData {
  id: number;
  ticker: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string | null;
  exitPrice: number | null;
  quantity: number;
  fees: number | null;
  notes: string | null;
  tags: string | null;
  isShort: boolean;
  pnl: number | null;
  pnlPercentage: number | null;
  holdingPeriod: number | null;
  status: 'Open' | 'Closed';
}

export interface PerformanceExportData {
  period: string;
  startDate: string;
  endDate: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitLoss: number;
  profitLossPercentage: number;
  winRate: number;
  averageReturn: number;
  largestWin: number;
  largestLoss: number;
  averageWin: number;
  averageLoss: number;
}

export class ExportService {
  static async exportTrades(options: ExportOptions): Promise<Buffer> {
    try {
      // Build query filters
      const where: any = {};
      
      if (options.dateRange) {
        where.entryDate = {
          gte: options.dateRange.start,
          lte: options.dateRange.end
        };
      }
      
      if (options.ticker) {
        where.ticker = options.ticker;
      }
      
      if (!options.includeOpenPositions) {
        where.exitDate = { not: null };
        where.exitPrice = { not: null };
      }

      // Fetch trades
      const trades = await prisma.trade.findMany({
        where,
        orderBy: { entryDate: 'desc' }
      });

      if (trades.length === 0) {
        throw new Error('No trades found matching the specified criteria');
      }

      // Transform data for export
      const exportData: TradeExportData[] = trades.map(trade => {
        const pnl = trade.exitPrice && trade.exitDate ? 
          (trade.isShort 
            ? (trade.entryPrice - trade.exitPrice) * trade.quantity
            : (trade.exitPrice - trade.entryPrice) * trade.quantity) - (trade.fees || 0)
          : null;
        
        const pnlPercentage = pnl && trade.entryPrice ? 
          (pnl / (trade.entryPrice * trade.quantity)) * 100 
          : null;
        
        const holdingPeriod = trade.exitDate ? 
          Math.ceil((new Date(trade.exitDate).getTime() - new Date(trade.entryDate).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return {
          id: trade.id,
          ticker: trade.ticker,
          entryDate: new Date(trade.entryDate).toLocaleDateString(),
          entryPrice: trade.entryPrice,
          exitDate: trade.exitDate ? new Date(trade.exitDate).toLocaleDateString() : null,
          exitPrice: trade.exitPrice || null,
          quantity: trade.quantity,
                      fees: trade.fees || null,
            notes: trade.notes || null,
            tags: trade.tags || null,
          isShort: trade.isShort,
          pnl,
          pnlPercentage,
          holdingPeriod,
          status: trade.exitDate ? 'Closed' : 'Open'
        };
      });

      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const columnWidths = [
        { wch: 8 },  // ID
        { wch: 10 }, // Ticker
        { wch: 12 }, // Entry Date
        { wch: 12 }, // Entry Price
        { wch: 12 }, // Exit Date
        { wch: 12 }, // Exit Price
        { wch: 10 }, // Quantity
        { wch: 10 }, // Fees
        { wch: 30 }, // Notes
        { wch: 20 }, // Tags
        { wch: 8 },  // Is Short
        { wch: 12 }, // P&L
        { wch: 12 }, // P&L %
        { wch: 12 }, // Holding Period
        { wch: 10 }  // Status
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Trades');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return buffer;
    } catch (error) {
      console.error('Error exporting trades:', error);
      throw new Error('Failed to export trades');
    }
  }

  static async exportPerformance(options: ExportOptions): Promise<Buffer> {
    try {
      // Build date filter
      let dateFilter = {};
      if (options.dateRange) {
        dateFilter = {
          entryDate: {
            gte: options.dateRange.start,
            lte: options.dateRange.end
          }
        };
      }

      // Build ticker filter
      const tickerFilter = options.ticker ? { ticker: options.ticker } : {};

      // Get trades
      const trades = await prisma.trade.findMany({
        where: {
          ...dateFilter,
          ...tickerFilter,
          exitDate: { not: null },
          exitPrice: { not: null }
        },
        orderBy: { entryDate: 'desc' }
      });

      if (trades.length === 0) {
        throw new Error('No closed trades found for performance analysis');
      }

      // Calculate performance metrics
      const performanceData = this.calculatePerformanceMetrics(trades);

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [{
        'Metric': 'Total Trades',
        'Value': performanceData.totalTrades
      }, {
        'Metric': 'Winning Trades',
        'Value': performanceData.winningTrades
      }, {
        'Metric': 'Losing Trades',
        'Value': performanceData.losingTrades
      }, {
        'Metric': 'Win Rate',
        'Value': `${performanceData.winRate.toFixed(2)}%`
      }, {
        'Metric': 'Total P&L',
        'Value': performanceData.totalPnL
      }, {
        'Metric': 'Average Return',
        'Value': performanceData.averageReturn
      }, {
        'Metric': 'Largest Win',
        'Value': performanceData.largestWin
      }, {
        'Metric': 'Largest Loss',
        'Value': performanceData.largestLoss
      }, {
        'Metric': 'Average Win',
        'Value': performanceData.averageWin
      }, {
        'Metric': 'Average Loss',
        'Value': performanceData.averageLoss
      }];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Monthly performance sheet
      if (performanceData.monthlyPerformance.length > 0) {
        const monthlySheet = XLSX.utils.json_to_sheet(performanceData.monthlyPerformance);
        monthlySheet['!cols'] = [
          { wch: 12 }, // Month
          { wch: 12 }, // Trades
          { wch: 12 }, // Wins
          { wch: 12 }, // P&L
          { wch: 12 }  // Win Rate
        ];
        XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Performance');
      }

      // Ticker performance sheet
      if (performanceData.tickerPerformance.length > 0) {
        const tickerSheet = XLSX.utils.json_to_sheet(performanceData.tickerPerformance);
        tickerSheet['!cols'] = [
          { wch: 10 }, // Ticker
          { wch: 12 }, // Trades
          { wch: 12 }, // Wins
          { wch: 12 }, // P&L
          { wch: 12 }, // Win Rate
          { wch: 15 }  // Volume
        ];
        XLSX.utils.book_append_sheet(workbook, tickerSheet, 'Ticker Performance');
      }

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return buffer;
    } catch (error) {
      console.error('Error exporting performance:', error);
      throw new Error('Failed to export performance data');
    }
  }

  private static calculatePerformanceMetrics(trades: any[]) {
    const closedTrades = trades.filter(trade => trade.exitDate && trade.exitPrice);
    
    // Helper function to calculate P&L
    const calculatePnL = (trade: any) => {
      const grossPnL = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return grossPnL - (trade.fees || 0);
    };

    // Basic metrics
    const totalPnL = closedTrades.reduce((sum, trade) => sum + calculatePnL(trade), 0);
    const winningTrades = closedTrades.filter(trade => calculatePnL(trade) > 0);
    const losingTrades = closedTrades.filter(trade => calculatePnL(trade) <= 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    const averageReturn = closedTrades.length > 0 ? totalPnL / closedTrades.length : 0;

    // Largest win/loss
    const pnlValues = closedTrades.map(calculatePnL);
    const largestWin = Math.max(...pnlValues, 0);
    const largestLoss = Math.min(...pnlValues, 0);

    // Average win/loss
    const winningPnLs = winningTrades.map(calculatePnL);
    const losingPnLs = losingTrades.map(calculatePnL);
    const averageWin = winningPnLs.length > 0 ? winningPnLs.reduce((sum, pnl) => sum + pnl, 0) / winningPnLs.length : 0;
    const averageLoss = losingPnLs.length > 0 ? losingPnLs.reduce((sum, pnl) => sum + pnl, 0) / losingPnLs.length : 0;

    // Monthly performance
    const monthlyPerformance = closedTrades.reduce((acc: any[], trade) => {
      const exitDate = new Date(trade.exitDate!);
      const monthKey = `${exitDate.getFullYear()}-${String(exitDate.getMonth() + 1).padStart(2, '0')}`;
      const pnl = calculatePnL(trade);
      
      const existing = acc.find(item => item.Month === monthKey);
      if (existing) {
        existing.Trades += 1;
        existing.PnL += pnl;
        if (pnl > 0) existing.Wins += 1;
      } else {
        acc.push({
          Month: monthKey,
          Trades: 1,
          Wins: pnl > 0 ? 1 : 0,
          PnL: pnl,
          'Win Rate': pnl > 0 ? '100%' : '0%'
        });
      }
      return acc;
    }, []);

    // Calculate win rates for monthly performance
    monthlyPerformance.forEach(month => {
      month['Win Rate'] = `${((month.Wins / month.Trades) * 100).toFixed(1)}%`;
    });

    // Ticker performance
    const tickerPerformance = closedTrades.reduce((acc: any[], trade) => {
      const pnl = calculatePnL(trade);
      
      const existing = acc.find(item => item.Ticker === trade.ticker);
      if (existing) {
        existing.Trades += 1;
        existing.PnL += pnl;
        existing.Volume += trade.entryPrice * trade.quantity;
        if (pnl > 0) existing.Wins += 1;
      } else {
        acc.push({
          Ticker: trade.ticker,
          Trades: 1,
          Wins: pnl > 0 ? 1 : 0,
          PnL: pnl,
          Volume: trade.entryPrice * trade.quantity,
          'Win Rate': pnl > 0 ? '100%' : '0%'
        });
      }
      return acc;
    }, []);

    // Calculate win rates for ticker performance
    tickerPerformance.forEach(ticker => {
      ticker['Win Rate'] = `${((ticker.Wins / ticker.Trades) * 100).toFixed(1)}%`;
    });

    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      totalPnL,
      winRate,
      averageReturn,
      largestWin,
      largestLoss,
      averageWin,
      averageLoss,
      monthlyPerformance,
      tickerPerformance
    };
  }

  static async exportAnalytics(options: ExportOptions): Promise<Buffer> {
    try {
      // This would combine both trades and performance data
      // For now, we'll export both sheets
      const tradesBuffer = await this.exportTrades(options);
      const performanceBuffer = await this.exportPerformance(options);

      // Create a combined workbook
      const workbook = XLSX.read(tradesBuffer, { type: 'buffer' });
      
      // Add performance data as additional sheets
      const performanceWorkbook = XLSX.read(performanceBuffer, { type: 'buffer' });
      
      performanceWorkbook.SheetNames.forEach(sheetName => {
        if (!workbook.SheetNames.includes(sheetName)) {
          workbook.Sheets[sheetName] = performanceWorkbook.Sheets[sheetName];
          workbook.SheetNames.push(sheetName);
        }
      });

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return buffer;
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw new Error('Failed to export analytics data');
    }
  }

  static async exportData(options: ExportOptions): Promise<{ buffer: Buffer; filename: string }> {
    let buffer: Buffer;
    let filename: string;

    switch (options.type) {
      case 'trades':
        buffer = await this.exportTrades(options);
        filename = `trades_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        break;
      case 'performance':
        buffer = await this.exportPerformance(options);
        filename = `performance_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        break;
      case 'analytics':
        buffer = await this.exportAnalytics(options);
        filename = `analytics_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        break;
      default:
        throw new Error('Invalid export type');
    }

    return { buffer, filename };
  }
} 