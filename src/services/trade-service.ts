import { TradeWithCalculations, TradeListRequest, TradeListResponse, CreateTradeRequest, Position, AddToPositionRequest } from '@/types/trade';
import { SupabaseService } from './supabase-service';

export class TradeService {
  private supabaseService: SupabaseService;
  private isInitialized = false;

  constructor() {
    this.supabaseService = SupabaseService.getInstance();
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      try {
        await this.supabaseService.initializeDatabase();
        await this.supabaseService.seedDatabase();
        this.isInitialized = true;
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    }
  }

  /**
   * Get paginated list of trades with filtering and sorting
   */
  async getTrades(request: TradeListRequest): Promise<TradeListResponse> {
    await this.ensureInitialized();
    
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

    // Get trades from Supabase
    const result = await this.supabaseService.getTrades(page, limit, {
      ticker,
      status,
      startDate,
      endDate,
      search,
      userId
    });

    const tradesWithCalculations = result.trades;
    const total = result.total;

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
  async getTradeById(id: string): Promise<TradeWithCalculations | null> {
    await this.ensureInitialized();
    try {
      return await this.supabaseService.getTradeById(id);
    } catch (error) {
      console.error('Error getting trade by ID:', error);
      return null;
    }
  }

  /**
   * Get position for a specific ticker
   */
  async getPosition(ticker: string): Promise<Position | null> {
    await this.ensureInitialized();
    try {
      const positions = await this.supabaseService.getPositions();
      const position = positions.find(p => p.ticker === ticker.toUpperCase());
      
      if (!position) {
        return null;
      }

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
            currentValue = position.totalQuantity * currentPrice;
            
            if (position.isShort) {
              unrealizedPnL = position.totalCost - currentValue;
            } else {
              unrealizedPnL = currentValue - position.totalCost;
            }
            
            unrealizedPnLPercentage = (unrealizedPnL / position.totalCost) * 100;
          }
        }
      } catch (error) {
        console.error('Error fetching current price for position:', error);
      }

      return {
        ...position,
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercentage
      };
    } catch (error) {
      console.error('Error getting position:', error);
      return null;
    }
  }

  /**
   * Check if a position exists for a ticker
   */
  async hasOpenPosition(ticker: string): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const positions = await this.supabaseService.getPositions();
      return positions.some(p => p.ticker === ticker.toUpperCase());
    } catch (error) {
      console.error('Error checking open position:', error);
      return false;
    }
  }

  /**
   * Add to an existing position
   */
  async addToPosition(data: AddToPositionRequest): Promise<Position> {
    await this.ensureInitialized();
    try {
      // Create the new trade using Supabase
      await this.supabaseService.addToPosition(data);

      // Get the updated position
      const position = await this.getPosition(data.ticker);
      if (!position) {
        throw new Error('Failed to retrieve updated position');
      }

      return position;
    } catch (error) {
      console.error('Error adding to position:', error);
      throw error;
    }
  }



  /**
   * Create a new trade
   */
  async createTrade(data: CreateTradeRequest): Promise<TradeWithCalculations> {
    await this.ensureInitialized();
    try {
      return await this.supabaseService.createTrade(data);
    } catch (error) {
      console.error('Error creating trade:', error);
      throw error;
    }
  }

  /**
   * Update an existing trade
   */
  async updateTrade(id: string, data: UpdateTradeRequest): Promise<TradeWithCalculations> {
    try {
      return await this.supabaseService.updateTrade(id, data);
    } catch (error) {
      console.error('Error updating trade:', error);
      throw error;
    }
  }

  /**
   * Delete a trade
   */
  async deleteTrade(id: string): Promise<boolean> {
    try {
      return await this.supabaseService.deleteTrade(id);
    } catch (error) {
      console.error('Error deleting trade:', error);
      return false;
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
    try {
      // Get all trades
      const result = await this.supabaseService.getTrades(1, 1000); // Get all trades
      const trades = result.trades;
      
      const totalTrades = trades.length;
      const openTrades = trades.filter(t => t.isOpen).length;
      const closedTrades = trades.filter(t => !t.isOpen).length;

      // Calculate profit/loss for closed trades
      let totalProfitLoss = 0;
      let winningTrades = 0;

      trades.forEach(trade => {
        if (!trade.isOpen && trade.profitLoss !== null) {
          totalProfitLoss += trade.profitLoss;
          if (trade.profitLoss > 0) {
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
    } catch (error) {
      console.error('Error getting trade stats:', error);
      return {
        totalTrades: 0,
        openTrades: 0,
        closedTrades: 0,
        totalProfitLoss: 0,
        averageProfitLoss: 0,
        winRate: 0
      };
    }
  }
}

// Export singleton instance
export const tradeService = new TradeService(); 