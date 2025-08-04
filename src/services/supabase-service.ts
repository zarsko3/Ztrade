import { supabaseAdmin, TABLES, DatabaseTrade } from '@/lib/supabase'
import { TradeWithCalculations, CreateTradeRequest, UpdateTradeRequest, Position, AddToPositionRequest } from '@/types/trade'

export class SupabaseService {
  private static instance: SupabaseService
  private isInitialized = false
  private initializationPromise: Promise<void> | null = null

  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService()
    }
    return SupabaseService.instance
  }

  private constructor() {
    // Private constructor to enforce singleton
  }

  // Convert database trade to application trade
  private mapDatabaseTradeToTrade(dbTrade: DatabaseTrade): TradeWithCalculations {
    return {
      id: dbTrade.id,
      ticker: dbTrade.ticker,
      entryDate: new Date(dbTrade.entry_date),
      entryPrice: dbTrade.entry_price,
      exitDate: dbTrade.exit_date ? new Date(dbTrade.exit_date) : undefined,
      exitPrice: dbTrade.exit_price || undefined,
      quantity: dbTrade.quantity,
      fees: dbTrade.fees || undefined,
      notes: dbTrade.notes || undefined,
      tags: dbTrade.tags || undefined,
      isShort: dbTrade.is_short,
      createdAt: new Date(dbTrade.created_at),
      updatedAt: new Date(dbTrade.updated_at),
      profitLoss: dbTrade.exit_price ? (dbTrade.exit_price - dbTrade.entry_price) * dbTrade.quantity - (dbTrade.fees || 0) : undefined,
      isOpen: !dbTrade.exit_date,
      totalCost: dbTrade.entry_price * dbTrade.quantity
    };
  }

  // Convert application trade to database trade
  private mapTradeToDatabaseTrade(trade: CreateTradeRequest | UpdateTradeRequest): Partial<DatabaseTrade> {
    // Helper function to convert date to ISO string
    const toISOString = (date: string | Date | undefined): string => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      return date.toISOString();
    };

    const dbTrade: Partial<DatabaseTrade> = {
      ticker: trade.ticker,
      entry_date: toISOString(trade.entryDate),
      entry_price: trade.entryPrice,
      exit_date: trade.exitDate ? toISOString(trade.exitDate) : null,
      exit_price: trade.exitPrice || null,
      quantity: trade.quantity,
      fees: trade.fees,
      notes: trade.notes || null,
      tags: trade.tags || null,
      is_short: trade.isShort
    }

    // Add user ID if provided (for new trades)
    if ('userId' in trade && trade.userId) {
      dbTrade.user_id = trade.userId;
    }

    return dbTrade;
  }

  // Get all trades with filtering and pagination
  async getTrades(request: any): Promise<{ trades: TradeWithCalculations[], pagination: any }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'entryDate',
        sortOrder = 'desc',
        ticker,
        startDate,
        endDate,
        status = 'all',
        search,
        userId
      } = request;

      console.log('SupabaseService getTrades called with:', { userId, page, limit, sortBy, sortOrder });

      let query = supabaseAdmin
        .from(TABLES.TRADES)
        .select('*', { count: 'exact' })

      // Apply user filter for data isolation (CRITICAL for security)
      if (userId) {
        query = query.eq('user_id', userId)
        console.log('Applied user filter for userId:', userId);
      } else {
        // If no userId provided, return empty result for security
        console.log('No userId provided, returning empty result for security');
        return { 
          trades: [], 
          pagination: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      }

      // Apply filters
      if (ticker) {
        query = query.ilike('ticker', `%${ticker}%`)
      }
      if (status !== 'all') {
        if (status === 'open') {
          query = query.is('exit_date', null)
        } else if (status === 'closed') {
          query = query.not('exit_date', 'is', null)
        }
      }
      if (startDate || endDate) {
        if (startDate) {
          query = query.gte('entry_date', startDate)
        }
        if (endDate) {
          query = query.lte('entry_date', endDate)
        }
      }
      if (search) {
        query = query.or(`ticker.ilike.%${search}%,notes.ilike.%${search}%,tags.ilike.%${search}%`)
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      // Apply sorting - simplified to avoid column mapping issues
      let sortColumn = 'entry_date'; // Default
      if (sortBy === 'ticker') {
        sortColumn = 'ticker';
      } else if (sortBy === 'createdAt') {
        sortColumn = 'created_at';
      }
      
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

      console.log('Executing Supabase query...');
      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching trades:', error)
        throw new Error(`Failed to fetch trades: ${error.message}`)
      }

      console.log('Query successful, processing results...');
      const trades = data?.map(trade => this.mapDatabaseTradeToTrade(trade)) || []
      const total = count || 0;
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      console.log('Returning trades:', { count: trades.length, total, totalPages });

      return { 
        trades, 
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev
        }
      }
    } catch (error) {
      console.error('SupabaseService getTrades error:', error)
      throw error
    }
  }

  // Get a single trade by ID
  async getTradeById(id: string): Promise<TradeWithCalculations | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from(TABLES.TRADES)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching trade:', error)
        return null
      }

      return data ? this.mapDatabaseTradeToTrade(data) : null
    } catch (error) {
      console.error('SupabaseService getTradeById error:', error)
      return null
    }
  }

  // Create a new trade
  async createTrade(tradeData: CreateTradeRequest): Promise<TradeWithCalculations> {
    try {
      const dbTrade = this.mapTradeToDatabaseTrade(tradeData)

      const { data, error } = await supabaseAdmin
        .from(TABLES.TRADES)
        .insert([dbTrade])
        .select()
        .single()

      if (error) {
        console.error('Error creating trade:', error)
        throw new Error('Failed to create trade')
      }

      return this.mapDatabaseTradeToTrade(data)
    } catch (error) {
      console.error('SupabaseService createTrade error:', error)
      throw error
    }
  }

  // Update an existing trade
  async updateTrade(id: string, tradeData: UpdateTradeRequest): Promise<TradeWithCalculations> {
    try {
      const dbTrade = this.mapTradeToDatabaseTrade(tradeData)

      const { data, error } = await supabaseAdmin
        .from(TABLES.TRADES)
        .update(dbTrade)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating trade:', error)
        throw new Error('Failed to update trade')
      }

      return this.mapDatabaseTradeToTrade(data)
    } catch (error) {
      console.error('SupabaseService updateTrade error:', error)
      throw error
    }
  }

  // Delete a trade
  async deleteTrade(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from(TABLES.TRADES)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting trade:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('SupabaseService deleteTrade error:', error)
      return false
    }
  }

  // Get positions (grouped trades by ticker)
  async getPositions(): Promise<Position[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from(TABLES.TRADES)
        .select('*')
        .is('exit_date', null)
        .order('ticker')

      if (error) {
        console.error('Error fetching positions:', error)
        throw new Error('Failed to fetch positions')
      }

      // Group trades by ticker
      const positionsMap = new Map<string, TradeWithCalculations[]>()
      
      data?.forEach(dbTrade => {
        const trade = this.mapDatabaseTradeToTrade(dbTrade)
        const ticker = trade.ticker
        
        if (!positionsMap.has(ticker)) {
          positionsMap.set(ticker, [])
        }
        positionsMap.get(ticker)!.push(trade)
      })

      // Convert to Position objects
      const positions: Position[] = Array.from(positionsMap.entries()).map(([ticker, trades]) => { 
        const totalQuantity = trades.reduce((sum, trade) => sum + trade.quantity, 0)
        const totalCost = trades.reduce((sum, trade) => sum + (trade.totalCost || 0), 0)
        const totalFees = trades.reduce((sum, trade) => sum + (trade.fees || 0), 0)
        const averageEntryPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0
        const isShort = trades[0]?.isShort || false
        const isOpen = trades.some(trade => trade.isOpen)

        return {
          ticker,
          trades,
          totalQuantity,
          averageEntryPrice,
          isShort,
          totalCost,
          totalInvestment: totalCost,
          totalFees,
          isOpen
        }
      })

      return positions
    } catch (error) {
      console.error('SupabaseService getPositions error:', error)
      throw error
    }
  }

  // Add to existing position
  async addToPosition(request: AddToPositionRequest): Promise<TradeWithCalculations> {
    try {
      const dbTrade = this.mapTradeToDatabaseTrade({
        ticker: request.ticker,
        entryDate: request.entryDate,
        entryPrice: request.entryPrice,
        quantity: request.quantity,
        fees: request.fees,
        notes: request.notes || '',
        tags: request.tags || '',
        isShort: request.isShort
      })

      const { data, error } = await supabaseAdmin
        .from(TABLES.TRADES)
        .insert([dbTrade])
        .select()
        .single()

      if (error) {
        console.error('Error adding to position:', error)
        throw new Error('Failed to add to position')
      }

      return this.mapDatabaseTradeToTrade(data)
    } catch (error) {
      console.error('SupabaseService addToPosition error:', error)
      throw error
    }
  }

  // Get current position for a ticker
  async getPosition(ticker: string, userId: string): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin
        .from(TABLES.TRADES)
        .select('*')
        .eq('ticker', ticker.toUpperCase())
        .eq('user_id', userId)
        .is('exit_date', null)
        .order('entry_date', { ascending: true })

      if (error) {
        console.error('Error fetching position:', error)
        return null
      }

      if (!data || data.length === 0) {
        return null
      }

      // Calculate position metrics
      const totalQuantity = data.reduce((sum, trade) => sum + trade.quantity, 0)
      const totalCost = data.reduce((sum, trade) => sum + (trade.entry_price * trade.quantity), 0)
      const averagePrice = totalCost / totalQuantity

      return {
        ticker: ticker.toUpperCase(),
        quantity: totalQuantity,
        averagePrice,
        totalCost,
        trades: data.map(trade => this.mapDatabaseTradeToTrade(trade))
      }
    } catch (error) {
      console.error('SupabaseService getPosition error:', error)
      return null
    }
  }

  // Check if user has an open position for a ticker
  async hasOpenPosition(ticker: string, userId: string): Promise<boolean> {
    try {
      const { count, error } = await supabaseAdmin
        .from(TABLES.TRADES)
        .select('*', { count: 'exact', head: true })
        .eq('ticker', ticker.toUpperCase())
        .eq('user_id', userId)
        .is('exit_date', null)

      if (error) {
        console.error('Error checking open position:', error)
        return false
      }

      return (count || 0) > 0
    } catch (error) {
      console.error('SupabaseService hasOpenPosition error:', error)
      return false
    }
  }

  // Get trade statistics
  async getTradeStats(userId: string): Promise<any> {
    try {
      // Get all trades for the user
      const { data, error } = await supabaseAdmin
        .from(TABLES.TRADES)
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching trade stats:', error)
        throw new Error('Failed to fetch trade statistics')
      }

      const trades = data?.map(trade => this.mapDatabaseTradeToTrade(trade)) || []
      
      const totalTrades = trades.length
      const openTrades = trades.filter(t => t.isOpen).length
      const closedTrades = trades.filter(t => !t.isOpen).length

      // Calculate profit/loss for closed trades
      const closedTradesData = trades.filter(t => !t.isOpen)
      const totalProfitLoss = closedTradesData.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0)
      const averageProfitLoss = closedTrades > 0 ? totalProfitLoss / closedTrades : 0
      const winningTrades = closedTradesData.filter(trade => (trade.profitLoss || 0) > 0).length
      const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0

      return {
        totalTrades,
        openTrades,
        closedTrades,
        totalProfitLoss,
        averageProfitLoss,
        winRate
      }
    } catch (error) {
      console.error('SupabaseService getTradeStats error:', error)
      throw new Error('Failed to fetch trade statistics')
    }
  }

  // Initialize database tables (run this once to set up the database)
  async initializeDatabase(): Promise<void> {
    // If already initialized, return immediately
    if (this.isInitialized) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = this.performInitialization();
    await this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('Initializing Supabase database...')
      
      // Check if tables exist by trying to query them
      const { error: tradesError } = await supabaseAdmin
        .from(TABLES.TRADES)
        .select('id')
        .limit(1)
      
      if (tradesError && tradesError.code === 'PGRST116') {
        console.log('Tables do not exist. Please create them in the Supabase dashboard:')
        console.log('1. Go to https://supabase.com/dashboard/project/khfzxzkpdxxsxhbmntel')
        console.log('2. Navigate to SQL Editor')
        console.log('3. Run the following SQL:')
        console.log(`
          CREATE TABLE trades (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            ticker VARCHAR(10) NOT NULL,
            entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
            entry_price DECIMAL(10,2) NOT NULL,
            exit_date TIMESTAMP WITH TIME ZONE,
            exit_price DECIMAL(10,2),
            quantity DECIMAL(15,4) NOT NULL,
            fees DECIMAL(10,2) DEFAULT 0,
            notes TEXT,
            tags TEXT,
            is_short BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE TABLE performance (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            period VARCHAR(20) NOT NULL,
            start_date TIMESTAMP WITH TIME ZONE NOT NULL,
            end_date TIMESTAMP WITH TIME ZONE NOT NULL,
            total_trades INTEGER NOT NULL,
            winning_trades INTEGER NOT NULL,
            losing_trades INTEGER NOT NULL,
            profit_loss DECIMAL(15,2) NOT NULL,
            sp_return DECIMAL(5,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `)
      } else {
        console.log('Supabase service initialized successfully')
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing database:', error)
      this.isInitialized = false;
      this.initializationPromise = null;
      throw error
    }
  }

  // Seed database with sample data
  async seedDatabase(): Promise<void> {
    try {
      console.log('Seeding Supabase database with sample data...')
      
      // Check if we already have data
      const { count } = await supabaseAdmin
        .from(TABLES.TRADES)
        .select('*', { count: 'exact', head: true })

      if (count && count > 0) {
        console.log('Database already has data, skipping seed')
        return
      }

      // Sample trades data (same as in mock-db.ts)
      const sampleTrades = [
        {
          ticker: 'NNE',
          entry_date: '2024-11-05T00:00:00Z',
          entry_price: 4.80,
          exit_date: '2025-03-12T00:00:00Z',
          exit_price: 6.10,
          quantity: 208.3333,
          fees: 9.99,
          notes: 'Small-cap energy play',
          tags: 'energy,small-cap',
          is_short: false
        },
        {
          ticker: 'MSTR',
          entry_date: '2024-09-10T00:00:00Z',
          entry_price: 370.00,
          exit_date: '2025-04-03T00:00:00Z',
          exit_price: 420.00,
          quantity: 2.7027,
          fees: 9.99,
          notes: 'Bitcoin proxy play',
          tags: 'crypto,bitcoin',
          is_short: false
        },
        {
          ticker: 'GOOGL',
          entry_date: '2024-10-15T00:00:00Z',
          entry_price: 150.00,
          exit_date: '2025-05-10T00:00:00Z',
          exit_price: 175.00,
          quantity: 6.6667,
          fees: 9.99,
          notes: 'AI momentum trade',
          tags: 'tech,ai',
          is_short: false
        },
        {
          ticker: 'AMD',
          entry_date: '2024-12-01T00:00:00Z',
          entry_price: 165.00,
          exit_date: '2025-06-15T00:00:00Z',
          exit_price: 180.00,
          quantity: 6.0606,
          fees: 9.99,
          notes: 'Semiconductor rotation',
          tags: 'tech,semiconductors',
          is_short: false
        },
        {
          ticker: 'QQQ',
          entry_date: '2024-11-20T00:00:00Z',
          entry_price: 430.00,
          exit_date: '2025-07-15T00:00:00Z',
          exit_price: 460.00,
          quantity: 2.3256,
          fees: 9.99,
          notes: 'Tech ETF position',
          tags: 'etf,tech',
          is_short: false
        },
        {
          ticker: 'LLY',
          entry_date: '2024-08-30T00:00:00Z',
          entry_price: 840.00,
          exit_date: '2025-02-28T00:00:00Z',
          exit_price: 960.00,
          quantity: 1.1905,
          fees: 9.99,
          notes: 'Pharma growth story',
          tags: 'pharma,healthcare',
          is_short: false
        },
        {
          ticker: 'NVDA',
          entry_date: '2025-04-25T00:00:00Z',
          entry_price: 115.00,
          exit_date: null,
          exit_price: null,
          quantity: 8.6957,
          fees: 9.99,
          notes: 'AI chip leader',
          tags: 'tech,ai,semiconductors',
          is_short: false
        },
        {
          ticker: 'HOOD',
          entry_date: '2025-05-02T00:00:00Z',
          entry_price: 20.00,
          exit_date: null,
          exit_price: null,
          quantity: 50.0000,
          fees: 9.99,
          notes: 'Fintech growth play',
          tags: 'fintech,brokerage',
          is_short: false
        },
        {
          ticker: 'NU',
          entry_date: '2025-06-05T00:00:00Z',
          entry_price: 12.00,
          exit_date: null,
          exit_price: null,
          quantity: 83.3333,
          fees: 9.99,
          notes: 'Digital banking in Latin America',
          tags: 'fintech,latin-america',
          is_short: false
        },
        {
          ticker: 'TSLA',
          entry_date: '2025-06-10T00:00:00Z',
          entry_price: 250.00,
          exit_date: null,
          exit_price: null,
          quantity: 4.0000,
          fees: 9.99,
          notes: 'EV market leader',
          tags: 'ev,automotive',
          is_short: false
        }
      ]

      const { error } = await supabaseAdmin
        .from(TABLES.TRADES)
        .insert(sampleTrades)

      if (error) {
        console.error('Error seeding database:', error)
        throw new Error('Failed to seed database')
      }

      console.log('Database seeded successfully with sample trades')
    } catch (error) {
      console.error('SupabaseService seedDatabase error:', error)
      throw error
    }
  }
} 