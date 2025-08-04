import { TradeWithCalculations, TradeListRequest, TradeListResponse, CreateTradeRequest, UpdateTradeRequest, Position, AddToPositionRequest } from '@/types/trade';
import { prisma } from '@/lib/prisma';

export class TradeService {
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
      search,
      userId
    } = request;

    // Build where clause for filtering
    const where: any = {};

    // Add user filter for data isolation
    if (userId) {
      where.userId = userId;
    }

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
        { notes: { contains: search } },
        { tags: { contains: search } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    try {
      // Get total count
      const total = await prisma.trade.count({ where });

      // Get trades with pagination and sorting
      const trades = await prisma.trade.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true
            }
          }
        }
      });

      // Calculate trade metrics
      const tradesWithCalculations = trades.map(trade => this.calculateTradeMetrics(trade));

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
    } catch (error) {
      console.error('Error fetching trades:', error);
      throw new Error('Failed to fetch trades');
    }
  }

  /**
   * Get a single trade by ID
   */
  async getTradeById(id: string): Promise<TradeWithCalculations | null> {
    try {
      const trade = await prisma.trade.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true
            }
          }
        }
      });

      return trade ? this.calculateTradeMetrics(trade) : null;
    } catch (error) {
      console.error('Error fetching trade by ID:', error);
      throw new Error('Failed to fetch trade');
    }
  }

  /**
   * Get current position for a ticker
   */
  async getPosition(ticker: string, userId: string): Promise<Position | null> {
    try {
      const openTrades = await prisma.trade.findMany({
        where: {
          ticker: ticker.toUpperCase(),
          userId,
          exitDate: null
        },
        orderBy: { entryDate: 'asc' }
      });

      if (openTrades.length === 0) {
        return null;
      }

      // Calculate position metrics
      const totalQuantity = openTrades.reduce((sum, trade) => sum + trade.quantity, 0);
      const totalCost = openTrades.reduce((sum, trade) => sum + (trade.entryPrice * trade.quantity), 0);
      const averagePrice = totalCost / totalQuantity;

      return {
        ticker: ticker.toUpperCase(),
        quantity: totalQuantity,
        averagePrice,
        totalCost,
        trades: openTrades.map(trade => this.calculateTradeMetrics(trade))
      };
    } catch (error) {
      console.error('Error fetching position:', error);
      throw new Error('Failed to fetch position');
    }
  }

  /**
   * Check if user has an open position for a ticker
   */
  async hasOpenPosition(ticker: string, userId: string): Promise<boolean> {
    try {
      const count = await prisma.trade.count({
        where: {
          ticker: ticker.toUpperCase(),
          userId,
          exitDate: null
        }
      });
      return count > 0;
    } catch (error) {
      console.error('Error checking open position:', error);
      return false;
    }
  }

  /**
   * Add to existing position
   */
  async addToPosition(data: AddToPositionRequest): Promise<Position> {
    try {
      // Create new trade entry
      const trade = await prisma.trade.create({
        data: {
          ticker: data.ticker.toUpperCase(),
          entryDate: new Date(data.entryDate),
          entryPrice: data.entryPrice,
          quantity: data.quantity,
          fees: data.fees,
          notes: data.notes,
          tags: data.tags,
          isShort: data.isShort || false,
          userId: data.userId
        }
      });

      // Return updated position
      return await this.getPosition(data.ticker, data.userId) || {
        ticker: data.ticker.toUpperCase(),
        quantity: data.quantity,
        averagePrice: data.entryPrice,
        totalCost: data.entryPrice * data.quantity,
        trades: [this.calculateTradeMetrics(trade)]
      };
    } catch (error) {
      console.error('Error adding to position:', error);
      throw new Error('Failed to add to position');
    }
  }

  /**
   * Create a new trade
   */
  async createTrade(data: CreateTradeRequest): Promise<TradeWithCalculations> {
    try {
      const trade = await prisma.trade.create({
        data: {
          ticker: data.ticker.toUpperCase(),
          entryDate: new Date(data.entryDate),
          entryPrice: data.entryPrice,
          exitDate: data.exitDate ? new Date(data.exitDate) : null,
          exitPrice: data.exitPrice,
          quantity: data.quantity,
          fees: data.fees,
          notes: data.notes,
          tags: data.tags,
          isShort: data.isShort || false,
          userId: data.userId
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true
            }
          }
        }
      });

      return this.calculateTradeMetrics(trade);
    } catch (error) {
      console.error('Error creating trade:', error);
      throw new Error('Failed to create trade');
    }
  }

  /**
   * Update an existing trade
   */
  async updateTrade(id: string, data: UpdateTradeRequest): Promise<TradeWithCalculations> {
    try {
      const trade = await prisma.trade.update({
        where: { id },
        data: {
          ...data,
          entryDate: data.entryDate ? new Date(data.entryDate) : undefined,
          exitDate: data.exitDate ? new Date(data.exitDate) : undefined,
          ticker: data.ticker ? data.ticker.toUpperCase() : undefined
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true
            }
          }
        }
      });

      return this.calculateTradeMetrics(trade);
    } catch (error) {
      console.error('Error updating trade:', error);
      throw new Error('Failed to update trade');
    }
  }

  /**
   * Delete a trade
   */
  async deleteTrade(id: string): Promise<boolean> {
    try {
      await prisma.trade.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting trade:', error);
      return false;
    }
  }

  /**
   * Get trade statistics
   */
  async getTradeStats(userId: string): Promise<{
    totalTrades: number;
    openTrades: number;
    closedTrades: number;
    totalProfitLoss: number;
    averageProfitLoss: number;
    winRate: number;
  }> {
    try {
      const [totalTrades, openTrades, closedTrades] = await Promise.all([
        prisma.trade.count({ where: { userId } }),
        prisma.trade.count({ where: { userId, exitDate: null } }),
        prisma.trade.count({ where: { userId, exitDate: { not: null } } })
      ]);

      // Get all closed trades for profit/loss calculation
      const closedTradesData = await prisma.trade.findMany({
        where: { userId, exitDate: { not: null } }
      });

      const tradesWithCalculations = closedTradesData.map(trade => this.calculateTradeMetrics(trade));
      const totalProfitLoss = tradesWithCalculations.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
      const averageProfitLoss = closedTrades > 0 ? totalProfitLoss / closedTrades : 0;
      const winningTrades = tradesWithCalculations.filter(trade => (trade.profitLoss || 0) > 0).length;
      const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;

      return {
        totalTrades,
        openTrades,
        closedTrades,
        totalProfitLoss,
        averageProfitLoss,
        winRate
      };
    } catch (error) {
      console.error('Error fetching trade stats:', error);
      throw new Error('Failed to fetch trade statistics');
    }
  }

  /**
   * Calculate trade metrics
   */
  private calculateTradeMetrics(trade: any): TradeWithCalculations {
    const entryValue = trade.entryPrice * trade.quantity;
    const exitValue = trade.exitPrice ? trade.exitPrice * trade.quantity : null;
    const fees = trade.fees || 0;

    let profitLoss = null;
    let profitLossPercentage = null;
    let isWinningTrade = null;

    if (exitValue !== null) {
      profitLoss = trade.isShort 
        ? entryValue - exitValue - fees 
        : exitValue - entryValue - fees;
      profitLossPercentage = (profitLoss / entryValue) * 100;
      isWinningTrade = profitLoss > 0;
    }

    return {
      ...trade,
      entryValue,
      exitValue,
      profitLoss,
      profitLossPercentage,
      isWinningTrade,
      fees
    };
  }
}

// Export singleton instance
export const tradeService = new TradeService(); 