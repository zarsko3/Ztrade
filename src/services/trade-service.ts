// import { PrismaClient } from '@prisma/client';
import { TradeWithCalculations, TradeListRequest, TradeListResponse, CreateTradeRequest, Position, AddToPositionRequest } from '@/types/trade';
import { mockDb } from '@/lib/mock-db';

export class TradeService {
  private prisma: any;

  constructor() {
    // Use mock database for now due to Prisma client issues
    this.prisma = mockDb;
    
    // Seed the database with sample data if empty
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    try {
      const tradeCount = await this.prisma.trade.count();
      if (tradeCount === 0) {
        console.log('Seeding database with sample trades...');
        this.prisma.seed();
        console.log('Database seeded successfully!');
      }
    } catch (error) {
      console.error('Error seeding database:', error);
    }
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
   * Get position for a specific ticker
   */
  async getPosition(ticker: string): Promise<Position | null> {
    const trades = await this.prisma.trade.findMany({
      where: { 
        ticker: ticker.toUpperCase(),
        exitDate: null // Only open trades
      },
      orderBy: { entryDate: 'asc' },
      include: {
        performance: true
      }
    });

    if (trades.length === 0) {
      return null;
    }

    // Calculate position metrics
    const totalQuantity = trades.reduce((sum, trade) => sum + trade.quantity, 0);
    const totalInvestment = trades.reduce((sum, trade) => sum + (trade.entryPrice * trade.quantity), 0);
    const totalFees = trades.reduce((sum, trade) => sum + (trade.fees || 0), 0);
    const averageEntryPrice = totalInvestment / totalQuantity;
    const isShort = trades[0].isShort; // All trades in a position should have the same direction

    // Calculate current value and unrealized P&L
    let currentValue = 0;
    let unrealizedPnL = 0;
    let unrealizedPnLPercentage = 0;

    try {
      // Fetch current market price
      const response = await fetch(`/api/market-data/quote?symbol=${ticker.toUpperCase()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          const currentPrice = data.data.regularMarketPrice;
          currentValue = totalQuantity * currentPrice;
          
          if (isShort) {
            unrealizedPnL = totalInvestment - currentValue - totalFees;
          } else {
            unrealizedPnL = currentValue - totalInvestment - totalFees;
          }
          
          unrealizedPnLPercentage = (unrealizedPnL / totalInvestment) * 100;
        }
      }
    } catch (error) {
      console.error('Error fetching current price for position:', error);
    }

    const tradesWithCalculations = trades.map(trade => this.calculateTradeFields(trade));

    return {
      ticker: ticker.toUpperCase(),
      totalQuantity,
      averageEntryPrice,
      totalInvestment,
      totalFees,
      isShort,
      isOpen: true,
      trades: tradesWithCalculations,
      currentValue,
      unrealizedPnL,
      unrealizedPnLPercentage
    };
  }

  /**
   * Check if a position exists for a ticker
   */
  async hasOpenPosition(ticker: string): Promise<boolean> {
    const count = await this.prisma.trade.count({
      where: { 
        ticker: ticker.toUpperCase(),
        exitDate: null
      }
    });
    return count > 0;
  }

  /**
   * Add to an existing position
   */
  async addToPosition(data: AddToPositionRequest): Promise<Position> {
    // Create the new trade
    const newTrade = await this.createTrade({
      ...data,
      ticker: data.ticker.toUpperCase(),
      isShort: false, // Assuming we're adding to a long position
      exitDate: undefined,
      exitPrice: undefined
    });

    // Get the updated position
    const position = await this.getPosition(data.ticker);
    if (!position) {
      throw new Error('Failed to retrieve updated position');
    }

    return position;
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
    const trade = await this.prisma.trade.create({
      data: {
        ticker: data.ticker.toUpperCase(),
        entryDate: new Date(data.entryDate),
        entryPrice: data.entryPrice,
        quantity: data.quantity,
        isShort: data.isShort,
        fees: data.fees || 0,
        notes: data.notes || '',
        tags: data.tags || '',
        exitDate: data.exitDate ? new Date(data.exitDate) : null,
        exitPrice: data.exitPrice || null
      },
      include: {
        performance: true
      }
    });

    return this.calculateTradeFields(trade);
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