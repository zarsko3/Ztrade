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
  
  if (isProduction) {
    return SupabaseService.getInstance();
  } else {
    return new TradeService();
  }
}

// Export singleton instance
export const tradeService = getTradeService(); 