// S&P 500 data service for benchmarking trades

interface SP500Data {
  date: string;
  close: number;
  return?: number;
}

interface TradeBenchmark {
  tradeId: number;
  ticker: string;
  tradeReturn: number;
  sp500Return: number;
  alpha: number;
  outperformance: boolean;
  tradeStartDate: string;
  tradeEndDate: string;
  sp500StartPrice: number;
  sp500EndPrice: number;
}

export class SP500Service {
  private static cache: { [key: string]: SP500Data[] } = {};
  private static cacheExpiry: { [key: string]: number } = {};

  // Get S&P 500 data from Yahoo Finance API
  private static async fetchSP500Data(startDate: string, endDate: string): Promise<SP500Data[]> {
    const cacheKey = `${startDate}-${endDate}`;
    const now = Date.now();
    
    // Check cache first
    if (this.cache[cacheKey] && this.cacheExpiry[cacheKey] > now) {
      return this.cache[cacheKey];
    }

    try {
      // Use absolute URL for server-side requests
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const url = `${baseUrl}/api/market-data/historical?symbol=^GSPC&startDate=${startDate}&endDate=${endDate}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch S&P 500 data: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid S&P 500 data format');
      }

      const sp500Data: SP500Data[] = data.data.map((item: any) => ({
        date: new Date(item.date).toISOString().split('T')[0],
        close: item.close
      }));

      // Calculate returns
      sp500Data.forEach((data, index) => {
        if (index > 0) {
          const prevClose = sp500Data[index - 1].close;
          data.return = ((data.close - prevClose) / prevClose) * 100;
        }
      });

      // Cache the data for 1 hour
      this.cache[cacheKey] = sp500Data;
      this.cacheExpiry[cacheKey] = now + (60 * 60 * 1000);

      return sp500Data;
    } catch (error) {
      console.error('Error fetching S&P 500 data:', error);
      // Return fallback data if API fails
      return this.getFallbackSP500Data(startDate, endDate);
    }
  }

  // Fallback data when API is unavailable
  private static getFallbackSP500Data(startDate: string, endDate: string): SP500Data[] {
    const fallbackData: SP500Data[] = [
      { date: '2024-01-01', close: 4769.83 },
      { date: '2024-02-01', close: 4927.93 },
      { date: '2024-03-01', close: 5137.08 },
      { date: '2024-04-01', close: 5205.81 },
      { date: '2024-05-01', close: 5035.69 },
      { date: '2024-06-01', close: 5277.51 },
      { date: '2024-07-01', close: 5461.27 },
      { date: '2025-01-01', close: 5650.00 },
      { date: '2025-07-26', close: 5670.00 },
    ];

    // Filter data for the requested date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return fallbackData.filter(data => {
      const dataDate = new Date(data.date);
      return dataDate >= start && dataDate <= end;
    });
  }

  // Get S&P 500 price for a specific date (or closest available date)
  static async getSP500Price(date: string): Promise<number> {
    try {
      const endDate = new Date(date);
      const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days before
      
      const data = await this.fetchSP500Data(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (data.length === 0) {
        return 5000; // Fallback price
      }

      const targetDate = new Date(date);
      let closestData = data[0];
      let minDiff = Math.abs(new Date(data[0].date).getTime() - targetDate.getTime());

      for (const item of data) {
        const dataDate = new Date(item.date);
        const diff = Math.abs(dataDate.getTime() - targetDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestData = item;
        }
      }

      return closestData.close;
    } catch (error) {
      console.error('Error getting S&P 500 price:', error);
      return 5000; // Fallback price
    }
  }

  // Calculate S&P 500 return between two dates
  static async calculateSP500Return(startDate: string, endDate: string): Promise<number> {
    try {
      const data = await this.fetchSP500Data(startDate, endDate);
      
      if (data.length < 2) {
        return 0;
      }

      const startPrice = data[0].close;
      const endPrice = data[data.length - 1].close;
      
      if (startPrice === 0) return 0;
      return ((endPrice - startPrice) / startPrice) * 100;
    } catch (error) {
      console.error('Error calculating S&P 500 return:', error);
      return 0;
    }
  }

  // Get S&P 500 data for a date range
  static async getSP500DataForPeriod(startDate: string, endDate: string): Promise<SP500Data[]> {
    return await this.fetchSP500Data(startDate, endDate);
  }

  // Calculate benchmark comparison for a trade
  static async calculateTradeBenchmark(
    tradeId: number,
    ticker: string,
    tradeReturn: number,
    startDate: string,
    endDate: string
  ): Promise<TradeBenchmark> {
    const sp500Return = await this.calculateSP500Return(startDate, endDate);
    const alpha = tradeReturn - sp500Return;
    const outperformance = alpha > 0;

    return {
      tradeId,
      ticker,
      tradeReturn,
      sp500Return,
      alpha,
      outperformance,
      tradeStartDate: startDate,
      tradeEndDate: endDate,
      sp500StartPrice: await this.getSP500Price(startDate),
      sp500EndPrice: await this.getSP500Price(endDate)
    };
  }

  // Get current S&P 500 price
  static async getCurrentSP500Price(): Promise<number> {
    try {
      const today = new Date();
      const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
      
      const data = await this.fetchSP500Data(
        yesterday.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      if (data.length > 0) {
        return data[data.length - 1].close;
      }
      
      return 5670; // Fallback current price
    } catch (error) {
      console.error('Error getting current S&P 500 price:', error);
      return 5670; // Fallback current price
    }
  }

  // Get S&P 500 performance for a specific period
  static async getSP500Performance(period: '1M' | '3M' | '6M' | '1Y' | 'YTD'): Promise<number> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case '1M':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case '3M':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case '6M':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case '1Y':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        case 'YTD':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      }

      const endDate = now;
      return await this.calculateSP500Return(
        startDate.toISOString().split('T')[0], 
        endDate.toISOString().split('T')[0]
      );
    } catch (error) {
      console.error('Error getting S&P 500 performance:', error);
      return 0;
    }
  }

  // Get all benchmark data for multiple trades
  static async calculateAllTradeBenchmarks(trades: any[]): Promise<TradeBenchmark[]> {
    const benchmarks: TradeBenchmark[] = [];
    
    for (const trade of trades) {
      if (trade.exitDate && trade.exitPrice) { // Only closed trades
        const grossPnL = trade.isShort 
          ? (trade.entryPrice - trade.exitPrice) * trade.quantity
          : (trade.exitPrice - trade.entryPrice) * trade.quantity;
        const netPnL = grossPnL - (trade.fees || 0);
        const tradeValue = trade.entryPrice * trade.quantity;
        const tradeReturn = tradeValue > 0 ? (netPnL / tradeValue) * 100 : 0;

        const benchmark = await this.calculateTradeBenchmark(
          trade.id,
          trade.ticker,
          tradeReturn,
          trade.entryDate,
          trade.exitDate
        );
        
        benchmarks.push(benchmark);
      }
    }
    
    return benchmarks;
  }

  // Get portfolio vs S&P 500 performance
  static async calculatePortfolioBenchmark(
    totalPnL: number,
    totalValue: number,
    startDate: string,
    endDate: string
  ): Promise<{
    portfolioReturn: number;
    sp500Return: number;
    alpha: number;
    outperformance: boolean;
  }> {
    const portfolioReturn = totalValue > 0 ? (totalPnL / totalValue) * 100 : 0;
    const sp500Return = await this.calculateSP500Return(startDate, endDate);
    const alpha = portfolioReturn - sp500Return;

    return {
      portfolioReturn,
      sp500Return,
      alpha,
      outperformance: alpha > 0
    };
  }

  // Clear cache (useful for testing or when data becomes stale)
  static clearCache(): void {
    this.cache = {};
    this.cacheExpiry = {};
  }
}

// Export types for use in other components
export type { SP500Data, TradeBenchmark }; 