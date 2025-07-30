/**
 * Mock database service for development
 * This simulates the Prisma client functionality until we can resolve the Prisma engine issues
 */

// Mock Trade model
interface Trade {
  id: number;
  ticker: string;
  entryDate: Date;
  entryPrice: number;
  exitDate?: Date | null;
  exitPrice?: number | null;
  quantity: number;
  fees?: number | null;
  notes?: string | null;
  tags?: string | null;
  isShort: boolean;
  createdAt: Date;
  updatedAt: Date;
  performanceId?: number | null;
}

// Type for creating a trade
type TradeCreateInput = Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>;

// Mock Performance model
interface Performance {
  id: number;
  period: string; // "weekly", "monthly", "yearly"
  startDate: Date;
  endDate: Date;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitLoss: number;
  spReturn: number; // S&P 500 return for the same period
  createdAt: Date;
  updatedAt: Date;
}

// Type for creating a performance record
type PerformanceCreateInput = Omit<Performance, 'id' | 'createdAt' | 'updatedAt'>;

// In-memory storage
const trades: Trade[] = [];
const performances: Performance[] = [];

// Mock Prisma client
export const mockDb = {
  trade: {
    findMany: async () => [...trades],
    findUnique: async ({ where }: { where: { id: number } }) => 
      trades.find(trade => trade.id === where.id) || null,
    count: async () => trades.length,
    create: async ({ data }: { data: TradeCreateInput }) => {
      const now = new Date();
      const newTrade: Trade = {
        ...data,
        id: trades.length + 1,
        createdAt: now,
        updatedAt: now
      };
      trades.push(newTrade);
      return newTrade;
    },
    update: async ({ where, data }: { where: { id: number }, data: Partial<Trade> }) => {
      const index = trades.findIndex(trade => trade.id === where.id);
      if (index === -1) {
        throw new Error(`Trade with ID ${where.id} not found`);
      }
      
      trades[index] = {
        ...trades[index],
        ...data,
        updatedAt: new Date()
      };
      
      return trades[index];
    },
    delete: async ({ where }: { where: { id: number } }) => {
      const index = trades.findIndex(trade => trade.id === where.id);
      if (index === -1) {
        throw new Error(`Trade with ID ${where.id} not found`);
      }
      
      const deletedTrade = trades[index];
      trades.splice(index, 1);
      
      return deletedTrade;
    }
  },
  performance: {
    findMany: async () => [...performances],
    findUnique: async ({ where }: { where: { id: number } }) => 
      performances.find(perf => perf.id === where.id) || null,
    count: async () => performances.length,
    create: async ({ data }: { data: PerformanceCreateInput }) => {
      const now = new Date();
      const newPerformance: Performance = {
        ...data,
        id: performances.length + 1,
        createdAt: now,
        updatedAt: now
      };
      performances.push(newPerformance);
      return newPerformance;
    }
  },
  // Add seed data for development
  seed: () => {
    // Clear existing data
    trades.length = 0;
    performances.length = 0;
    
    // Add sample trades - Mix of closed and open positions
    // Closed trades
    mockDb.trade.create({
      data: {
        ticker: 'NNE',
        entryDate: new Date('2024-11-05'),
        entryPrice: 4.80,
        exitDate: new Date('2025-03-12'),
        exitPrice: 6.10,
        quantity: 208.3333,
        fees: 9.99,
        notes: 'Small-cap energy play',
        tags: 'energy,small-cap',
        isShort: false
      }
    });
    
    mockDb.trade.create({
      data: {
        ticker: 'MSTR',
        entryDate: new Date('2024-09-10'),
        entryPrice: 370.00,
        exitDate: new Date('2025-04-03'),
        exitPrice: 420.00,
        quantity: 2.7027,
        fees: 9.99,
        notes: 'Bitcoin proxy play',
        tags: 'crypto,bitcoin',
        isShort: false
      }
    });
    
    mockDb.trade.create({
      data: {
        ticker: 'GOOGL',
        entryDate: new Date('2024-10-15'),
        entryPrice: 150.00,
        exitDate: new Date('2025-05-10'),
        exitPrice: 175.00,
        quantity: 6.6667,
        fees: 9.99,
        notes: 'AI momentum trade',
        tags: 'tech,ai',
        isShort: false
      }
    });
    
    mockDb.trade.create({
      data: {
        ticker: 'AMD',
        entryDate: new Date('2024-12-01'),
        entryPrice: 165.00,
        exitDate: new Date('2025-06-15'),
        exitPrice: 180.00,
        quantity: 6.0606,
        fees: 9.99,
        notes: 'Semiconductor rotation',
        tags: 'tech,semiconductors',
        isShort: false
      }
    });
    
    mockDb.trade.create({
      data: {
        ticker: 'QQQ',
        entryDate: new Date('2024-11-20'),
        entryPrice: 430.00,
        exitDate: new Date('2025-07-15'),
        exitPrice: 460.00,
        quantity: 2.3256,
        fees: 9.99,
        notes: 'Tech ETF position',
        tags: 'etf,tech',
        isShort: false
      }
    });
    
    mockDb.trade.create({
      data: {
        ticker: 'LLY',
        entryDate: new Date('2024-08-30'),
        entryPrice: 840.00,
        exitDate: new Date('2025-02-28'),
        exitPrice: 960.00,
        quantity: 1.1905,
        fees: 9.99,
        notes: 'Pharma growth story',
        tags: 'pharma,healthcare',
        isShort: false
      }
    });
    
    // Open trades
    mockDb.trade.create({
      data: {
        ticker: 'NVDA',
        entryDate: new Date('2025-04-25'),
        entryPrice: 115.00,
        exitDate: null,
        exitPrice: null,
        quantity: 8.6957,
        fees: 9.99,
        notes: 'AI chip leader',
        tags: 'tech,ai,semiconductors',
        isShort: false
      }
    });
    
    mockDb.trade.create({
      data: {
        ticker: 'HOOD',
        entryDate: new Date('2025-05-02'),
        entryPrice: 20.00,
        exitDate: null,
        exitPrice: null,
        quantity: 50.0000,
        fees: 9.99,
        notes: 'Fintech growth play',
        tags: 'fintech,brokerage',
        isShort: false
      }
    });
    
    mockDb.trade.create({
      data: {
        ticker: 'NU',
        entryDate: new Date('2025-06-05'),
        entryPrice: 12.00,
        exitDate: null,
        exitPrice: null,
        quantity: 83.3333,
        fees: 9.99,
        notes: 'Digital banking in Latin America',
        tags: 'fintech,latin-america',
        isShort: false
      }
    });
    
    mockDb.trade.create({
      data: {
        ticker: 'TSLA',
        entryDate: new Date('2025-06-10'),
        entryPrice: 250.00,
        exitDate: null,
        exitPrice: null,
        quantity: 4.0000,
        fees: 9.99,
        notes: 'EV market leader',
        tags: 'ev,automotive',
        isShort: false
      }
    });
    
    // Add sample performance records
    mockDb.performance.create({
      data: {
        period: 'monthly',
        startDate: new Date('2024-11-01'),
        endDate: new Date('2024-11-30'),
        totalTrades: 3,
        winningTrades: 2,
        losingTrades: 1,
        profitLoss: 572.74,
        spReturn: 2.8
      }
    });
    
    mockDb.performance.create({
      data: {
        period: 'monthly',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-31'),
        totalTrades: 2,
        winningTrades: 1,
        losingTrades: 1,
        profitLoss: 156.68,
        spReturn: 1.2
      }
    });
    
    return { trades, performances };
  }
}; 