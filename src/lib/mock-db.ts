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
    
    // Add sample trades
    mockDb.trade.create({
      data: {
        ticker: 'AAPL',
        entryDate: new Date('2023-01-15'),
        entryPrice: 135.5,
        exitDate: new Date('2023-02-20'),
        exitPrice: 152.75,
        quantity: 10,
        fees: 9.99,
        notes: 'Bought on dip after earnings',
        tags: 'tech,earnings',
        isShort: false
      }
    });
    
    mockDb.trade.create({
      data: {
        ticker: 'MSFT',
        entryDate: new Date('2023-02-01'),
        entryPrice: 240.25,
        exitDate: new Date('2023-03-15'),
        exitPrice: 265.5,
        quantity: 5,
        fees: 9.99,
        notes: 'Technical breakout',
        tags: 'tech,breakout',
        isShort: false
      }
    });
    
    mockDb.trade.create({
      data: {
        ticker: 'TSLA',
        entryDate: new Date('2023-03-10'),
        entryPrice: 180.5,
        quantity: 8,
        fees: 9.99,
        notes: 'Long-term hold',
        tags: 'ev,tech',
        isShort: false
      }
    });
    
    // Add sample performance records
    mockDb.performance.create({
      data: {
        period: 'monthly',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
        totalTrades: 5,
        winningTrades: 3,
        losingTrades: 2,
        profitLoss: 1250.75,
        spReturn: 3.5
      }
    });
    
    mockDb.performance.create({
      data: {
        period: 'monthly',
        startDate: new Date('2023-02-01'),
        endDate: new Date('2023-02-28'),
        totalTrades: 4,
        winningTrades: 2,
        losingTrades: 2,
        profitLoss: -450.25,
        spReturn: -2.1
      }
    });
    
    return { trades, performances };
  }
}; 