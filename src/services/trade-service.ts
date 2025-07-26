import { PrismaClient } from '@prisma/client';
import { TradeWithCalculations, TradeListRequest, TradeListResponse, CreateTradeRequest } from '@/types/trade';

export class TradeService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get paginated list of trades with filtering and sorting
   */
  async getTrades(request: TradeListRequest): Promise<TradeListResponse> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'entryDate',
      sortOrder = 'desc',
      ticker,
      startDate,
      endDate,
      status = 'all',
      search
    } = request;

    // Build where clause for filtering
    const where: any = {};

    if (ticker) {
      where.ticker = { contains: ticker.toUpperCase() };
    }

    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) {
        where.entryDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.entryDate.lte = new Date(endDate);
      }
    }

    if (status !== 'all') {
      if (status === 'open') {
        where.exitDate = null;
      } else if (status === 'closed') {
        where.exitDate = { not: null };
      }
    }

    if (search) {
      where.OR = [
        { ticker: { contains: search.toUpperCase() } },
        { notes: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await this.prisma.trade.count({ where });

    // Get trades with pagination
    const trades = await this.prisma.trade.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        performance: true
      }
    });

    // Calculate additional fields for each trade
    const tradesWithCalculations = trades.map(trade => 
      this.calculateTradeFields(trade)
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      trades: tradesWithCalculations,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    };
  }

  /**
   * Get a single trade by ID
   */
  async getTradeById(id: number): Promise<TradeWithCalculations | null> {
    const trade = await this.prisma.trade.findUnique({
      where: { id },
      include: {
        performance: true
      }
    });

    if (!trade) {
      return null;
    }

    return this.calculateTradeFields(trade);
  }

  /**
   * Calculate additional fields for a trade
   */
  private calculateTradeFields(trade: any): TradeWithCalculations {
    const isOpen = !trade.exitDate;
    let profitLoss: number | undefined;
    let profitLossPercentage: number | undefined;
    let holdingPeriod: number | undefined;

    if (!isOpen && trade.exitPrice) {
      const totalEntry = trade.entryPrice * trade.quantity;
      const totalExit = trade.exitPrice * trade.quantity;
      const fees = trade.fees || 0;

      if (trade.isShort) {
        profitLoss = totalEntry - totalExit - fees;
      } else {
        profitLoss = totalExit - totalEntry - fees;
      }

      profitLossPercentage = (profitLoss / totalEntry) * 100;

      // Calculate holding period in days
      const entryDate = new Date(trade.entryDate);
      const exitDate = new Date(trade.exitDate);
      holdingPeriod = Math.ceil((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      ...trade,
      profitLoss,
      profitLossPercentage,
      isOpen,
      holdingPeriod
    };
  }

  /**
   * Create a new trade
   */
  async createTrade(data: CreateTradeRequest): Promise<TradeWithCalculations> {
    try {
      console.log('TradeService.createTrade received data:', data);
      
      // Validate required fields
      if (!data.ticker || !data.entryDate || !data.entryPrice || !data.quantity) {
        throw new Error('Missing required fields: ticker, entryDate, entryPrice, quantity');
      }

      // Validate numeric fields
      if (data.entryPrice <= 0 || data.quantity <= 0) {
        throw new Error('Entry price and quantity must be positive numbers');
      }

      // Validate dates
      const entryDate = new Date(data.entryDate);
      if (isNaN(entryDate.getTime())) {
        throw new Error('Invalid entry date format');
      }

      // Validate exit data if provided
      if (data.exitDate && data.exitPrice) {
        const exitDate = new Date(data.exitDate);
        if (isNaN(exitDate.getTime())) {
          throw new Error('Invalid exit date format');
        }
        if (data.exitPrice <= 0) {
          throw new Error('Exit price must be a positive number');
        }
        if (exitDate < entryDate) {
          throw new Error('Exit date cannot be before entry date');
        }
      }

      // Create trade in database
      const tradeData = {
        ticker: data.ticker.toUpperCase(),
        entryDate: entryDate,
        entryPrice: data.entryPrice,
        quantity: data.quantity,
        isShort: data.isShort,
        fees: data.fees || 0,
        notes: data.notes || null,
        tags: data.tags || null,
        exitDate: data.exitDate ? new Date(data.exitDate) : null,
        exitPrice: data.exitPrice || null,
      };
      
      console.log('TradeService creating trade with data:', tradeData);
      
      const trade = await this.prisma.trade.create({
        data: tradeData,
      });
      
      console.log('TradeService created trade:', trade);

      // Calculate additional fields
      return this.calculateTradeFields(trade);
    } catch (error) {
      console.error('Error creating trade:', error);
      throw error;
    }
  }

  /**
   * Get trade statistics
   */
  async getTradeStats(): Promise<{
    totalTrades: number;
    openTrades: number;
    closedTrades: number;
    totalProfitLoss: number;
    averageProfitLoss: number;
    winRate: number;
  }> {
    const [totalTrades, openTrades, closedTrades] = await Promise.all([
      this.prisma.trade.count(),
      this.prisma.trade.count({ where: { exitDate: null } }),
      this.prisma.trade.count({ where: { exitDate: { not: null } } })
    ]);

    // Calculate profit/loss for closed trades
    const closedTradesData = await this.prisma.trade.findMany({
      where: { exitDate: { not: null } }
    });

    let totalProfitLoss = 0;
    let winningTrades = 0;

    closedTradesData.forEach(trade => {
      if (trade.exitPrice) {
        const totalEntry = trade.entryPrice * trade.quantity;
        const totalExit = trade.exitPrice * trade.quantity;
        const fees = trade.fees || 0;

        let profitLoss: number;
        if (trade.isShort) {
          profitLoss = totalEntry - totalExit - fees;
        } else {
          profitLoss = totalExit - totalEntry - fees;
        }

        totalProfitLoss += profitLoss;
        if (profitLoss > 0) {
          winningTrades++;
        }
      }
    });

    const averageProfitLoss = closedTrades > 0 ? totalProfitLoss / closedTrades : 0;
    const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;

    return {
      totalTrades,
      openTrades,
      closedTrades,
      totalProfitLoss,
      averageProfitLoss,
      winRate
    };
  }
}

// Export singleton instance
export const tradeService = new TradeService(); 