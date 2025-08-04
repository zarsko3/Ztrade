import { TradeService } from './trade-service';
import { SupabaseService } from './supabase-service';

// Define the interface that both services should implement
export interface ITradeService {
  getTrades(request: any): Promise<any>;
  getTradeById(id: string): Promise<any>;
  getPosition(ticker: string, userId: string): Promise<any>;
  hasOpenPosition(ticker: string, userId: string): Promise<boolean>;
  addToPosition(data: any): Promise<any>;
  createTrade(data: any): Promise<any>;
  updateTrade(id: string, data: any): Promise<any>;
  deleteTrade(id: string): Promise<boolean>;
  getTradeStats(userId: string): Promise<any>;
}

// Factory function to get the appropriate service
export function getTradeService(): ITradeService {
  // Always use Supabase in production, Prisma in development
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log(`Trade Service Factory: Environment=${process.env.NODE_ENV}, Using ${isProduction ? 'Supabase' : 'Prisma'} service`);
  
  if (isProduction) {
    console.log('Production detected - using SupabaseService');
    try {
      const service = SupabaseService.getInstance();
      console.log('SupabaseService created successfully:', {
        constructor: service.constructor.name,
        hasGetTrades: typeof service.getTrades === 'function',
        hasGetTradeById: typeof service.getTradeById === 'function'
      });
      return service;
    } catch (error) {
      console.error('Error creating SupabaseService:', error);
      throw error;
    }
  } else {
    console.log('Development detected - using TradeService (Prisma)');
    try {
      const service = new TradeService();
      console.log('TradeService created successfully:', {
        constructor: service.constructor.name,
        hasGetTrades: typeof service.getTrades === 'function',
        hasGetTradeById: typeof service.getTradeById === 'function'
      });
      return service;
    } catch (error) {
      console.error('Error creating TradeService:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const tradeService = getTradeService(); 