import yahooFinance from 'yahoo-finance2';

export interface YahooQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  marketCap: number;
  currency: string;
}

export interface YahooHistoricalData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SP500Data {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  lastUpdated: Date;
}

export class YahooFinanceService {
  private static instance: YahooFinanceService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): YahooFinanceService {
    if (!YahooFinanceService.instance) {
      YahooFinanceService.instance = new YahooFinanceService();
    }
    return YahooFinanceService.instance;
  }

  /**
   * Get current quote for a symbol
   */
  async getQuote(symbol: string): Promise<YahooQuote> {
    const cacheKey = `quote:${symbol}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const quote: any = await yahooFinance.quote(symbol);
      
      const result: YahooQuote = {
        symbol: quote.symbol || symbol,
        regularMarketPrice: quote.regularMarketPrice || 0,
        regularMarketChange: quote.regularMarketChange || 0,
        regularMarketChangePercent: quote.regularMarketChangePercent || 0,
        regularMarketTime: quote.regularMarketTime || Date.now() / 1000,
        regularMarketDayHigh: quote.regularMarketDayHigh || 0,
        regularMarketDayLow: quote.regularMarketDayLow || 0,
        regularMarketVolume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap || 0,
        currency: quote.currency || 'USD'
      };

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }
  }

  /**
   * Get historical data for a symbol
   */
  async getHistoricalData(
    symbol: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<YahooHistoricalData[]> {
    const cacheKey = `historical:${symbol}:${startDate.toISOString()}:${endDate.toISOString()}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Use chart API for historical data
      const chart: any = await yahooFinance.chart(symbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d'
      });

      if (!chart.quotes || chart.quotes.length === 0) {
        return [];
      }

      const result: YahooHistoricalData[] = chart.quotes.map((quote: any) => ({
        date: new Date(quote.date),
        open: quote.open || 0,
        high: quote.high || 0,
        low: quote.low || 0,
        close: quote.close || 0,
        volume: quote.volume || 0
      }));

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      throw new Error(`Failed to fetch historical data for ${symbol}`);
    }
  }

  /**
   * Get S&P 500 current data
   */
  async getSP500Data(): Promise<SP500Data> {
    const cacheKey = 'sp500:current';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const quote = await this.getQuote('^GSPC'); // S&P 500 index
      
      const result: SP500Data = {
        symbol: 'S&P 500',
        currentPrice: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        lastUpdated: new Date(quote.regularMarketTime * 1000)
      };

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching S&P 500 data:', error);
      throw new Error('Failed to fetch S&P 500 data');
    }
  }

  /**
   * Get S&P 500 price for a specific date
   */
  async getSP500PriceForDate(date: Date): Promise<number> {
    const cacheKey = `sp500:${date.toISOString().split('T')[0]}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Get data for the specific date
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const historical = await this.getHistoricalData('^GSPC', startDate, endDate);
      
      if (historical.length === 0) {
        // If no data for that specific date, try to get the closest available date
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - 7);
        const weekEnd = new Date(date);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        const weekData = await this.getHistoricalData('^GSPC', weekStart, weekEnd);
        if (weekData.length > 0) {
          // Return the closest date's closing price
          const closest = weekData.reduce((prev, curr) => {
            const prevDiff = Math.abs(prev.date.getTime() - date.getTime());
            const currDiff = Math.abs(curr.date.getTime() - date.getTime());
            return prevDiff < currDiff ? prev : curr;
          });
          
          this.setCachedData(cacheKey, closest.close);
          return closest.close;
        }
        
        throw new Error(`No S&P 500 data available for ${date.toISOString()}`);
      }

      const price = historical[0].close;
      this.setCachedData(cacheKey, price);
      return price;
    } catch (error) {
      console.error(`Error fetching S&P 500 price for ${date}:`, error);
      throw new Error(`Failed to fetch S&P 500 price for ${date}`);
    }
  }

  /**
   * Get current price for any symbol
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const quote = await this.getQuote(symbol);
      return quote.regularMarketPrice;
    } catch (error) {
      console.error(`Error fetching current price for ${symbol}:`, error);
      throw new Error(`Failed to fetch current price for ${symbol}`);
    }
  }

  /**
   * Calculate percentage return between two dates for a symbol
   */
  async calculateReturn(
    symbol: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<{ return: number; returnPercentage: number }> {
    try {
      const historical = await this.getHistoricalData(symbol, startDate, endDate);
      
      if (historical.length < 2) {
        throw new Error('Insufficient data for return calculation');
      }

      const startPrice = historical[0].close;
      const endPrice = historical[historical.length - 1].close;
      
      const returnAmount = endPrice - startPrice;
      const returnPercentage = ((endPrice - startPrice) / startPrice) * 100;

      return {
        return: returnAmount,
        returnPercentage: returnPercentage
      };
    } catch (error) {
      console.error(`Error calculating return for ${symbol}:`, error);
      throw new Error(`Failed to calculate return for ${symbol}`);
    }
  }

  /**
   * Search for symbols
   */
  async searchSymbols(query: string): Promise<Array<{ symbol: string; name: string }>> {
    const cacheKey = `search:${query}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const search: any = await yahooFinance.search(query);
      
      const result = search.quotes
        .filter((quote: any) => quote.symbol && quote.shortname)
        .map((quote: any) => ({
          symbol: quote.symbol,
          name: quote.shortname || quote.longname || quote.symbol
        }));

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error searching symbols for ${query}:`, error);
      throw new Error(`Failed to search symbols for ${query}`);
    }
  }

  /**
   * Get market hours status
   */
  async getMarketStatus(): Promise<{ isOpen: boolean; nextOpen?: Date; nextClose?: Date }> {
    try {
      const quote = await this.getQuote('^GSPC');
      const now = new Date();
      const marketTime = new Date(quote.regularMarketTime * 1000);
      
      // Simple check - if market time is within last 24 hours, market is likely open
      const timeDiff = now.getTime() - marketTime.getTime();
      const isOpen = timeDiff < 24 * 60 * 60 * 1000; // 24 hours

      return { isOpen };
    } catch (error) {
      console.error('Error getting market status:', error);
      return { isOpen: false };
    }
  }

  /**
   * Cache management
   */
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default YahooFinanceService.getInstance(); 