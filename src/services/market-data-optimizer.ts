import yahooFinance from 'yahoo-finance2';

// Suppress Yahoo Finance notices
yahooFinance.suppressNotices(['yahooSurvey']);

export interface OptimizedMarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
  lastUpdated: string;
  dataQuality: 'live' | 'cached' | 'mock';
  source: 'yahoo' | 'cache' | 'fallback';
}

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  requestDelay: number; // milliseconds between requests
  cacheDuration: number; // milliseconds
  retryAttempts: number;
  retryDelay: number;
}

class MarketDataOptimizer {
  private static instance: MarketDataOptimizer;
  private cache: Map<string, { data: OptimizedMarketData; timestamp: number }> = new Map();
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private requestCount = 0;
  private lastRequestTime = 0;
  private hourlyRequestCount = 0;
  private lastHourReset = Date.now();

  // Rate limiting configuration - following Yahoo Finance guidelines
  private config: RateLimitConfig = {
    maxRequestsPerMinute: 20, // More conservative limit
    maxRequestsPerHour: 800,  // Reduced hourly limit
    requestDelay: 3000, // 3 seconds between requests (90 seconds / 30 symbols = 3s each)
    cacheDuration: 90000, // 90 seconds cache (Yahoo Finance recommended refresh rate)
    retryAttempts: 2,
    retryDelay: 5000
  };

  // Mock data for fallback
  private mockPrices: { [key: string]: number } = {
    '^GSPC': 5000,
    'AAPL': 180,
    'GOOGL': 140,
    'MSFT': 400,
    'TSLA': 250,
    'AMZN': 150,
    'NVDA': 800,
    'META': 300,
    'NFLX': 600,
    'JPM': 180,
    'JNJ': 160,
    'PG': 150,
    'UNH': 500,
    'HD': 350,
    'MA': 400,
    'V': 250,
    'PYPL': 60,
    'ADBE': 500,
    'CRM': 200,
    'NKE': 100
  };

  static getInstance(): MarketDataOptimizer {
    if (!MarketDataOptimizer.instance) {
      MarketDataOptimizer.instance = new MarketDataOptimizer();
    }
    return MarketDataOptimizer.instance;
  }

  /**
   * Get optimized market data with rate limiting and caching
   */
  async getMarketData(symbols: string[]): Promise<OptimizedMarketData[]> {
    const results: OptimizedMarketData[] = [];
    
    for (const symbol of symbols) {
      try {
        const data = await this.getSingleSymbolData(symbol);
        results.push(data);
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        // Add fallback data
        results.push(this.createFallbackData(symbol));
      }
    }

    return results;
  }

  /**
   * Get data for a single symbol with caching and rate limiting
   */
  private async getSingleSymbolData(symbol: string): Promise<OptimizedMarketData> {
    // Check cache first
    const cached = this.getCachedData(symbol);
    if (cached) {
      return {
        ...cached,
        dataQuality: 'cached' as const,
        source: 'cache' as const
      };
    }

    // Check rate limits
    await this.checkRateLimits();

    // Fetch from Yahoo Finance
    try {
      const quote = await this.fetchWithRetry(symbol);
      
      const data: OptimizedMarketData = {
        symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        timestamp: new Date().toISOString(),
        lastUpdated: new Date(quote.regularMarketTime * 1000).toISOString(),
        dataQuality: 'live' as const,
        source: 'yahoo' as const
      };

      // Cache the data
      this.cacheData(symbol, data);
      
      return data;
    } catch (error) {
      console.error(`Failed to fetch data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Fetch data with retry logic
   */
  private async fetchWithRetry(symbol: string, attempt = 1): Promise<any> {
    try {
      const quote = await Promise.race([
        yahooFinance.quote(symbol),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 8000) // 8 second timeout
        )
      ]);

      return quote;
    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        console.log(`Retry attempt ${attempt} for ${symbol}`);
        await this.delay(this.config.retryDelay);
        return this.fetchWithRetry(symbol, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Check and enforce rate limits
   */
  private async checkRateLimits(): Promise<void> {
    const now = Date.now();
    
    // Reset hourly counter if needed
    if (now - this.lastHourReset > 60 * 60 * 1000) {
      this.hourlyRequestCount = 0;
      this.lastHourReset = now;
    }

    // Check hourly limit
    if (this.hourlyRequestCount >= this.config.maxRequestsPerHour) {
      throw new Error('Hourly rate limit exceeded');
    }

    // Check minute limit
    if (this.requestCount >= this.config.maxRequestsPerMinute) {
      const timeSinceFirstRequest = now - this.lastRequestTime;
      if (timeSinceFirstRequest < 60 * 1000) {
        const waitTime = 60 * 1000 - timeSinceFirstRequest;
        console.log(`Rate limit reached, waiting ${waitTime}ms`);
        await this.delay(waitTime);
        this.requestCount = 0;
      }
    }

    // Enforce delay between requests
    if (now - this.lastRequestTime < this.config.requestDelay) {
      const waitTime = this.config.requestDelay - (now - this.lastRequestTime);
      await this.delay(waitTime);
    }

    // Update counters
    this.requestCount++;
    this.hourlyRequestCount++;
    this.lastRequestTime = now;
  }

  /**
   * Get cached data if still valid
   */
  private getCachedData(symbol: string): OptimizedMarketData | null {
    const cached = this.cache.get(symbol);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp < this.config.cacheDuration) {
      return cached.data;
    }

    // Remove expired cache
    this.cache.delete(symbol);
    return null;
  }

  /**
   * Cache market data
   */
  private cacheData(symbol: string, data: OptimizedMarketData): void {
    this.cache.set(symbol, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Create fallback data when API fails
   */
  private createFallbackData(symbol: string): OptimizedMarketData {
    const mockPrice = this.mockPrices[symbol] || 100;
    
    return {
      symbol,
      price: mockPrice,
      change: 0,
      changePercent: 0,
      volume: 1000000,
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      dataQuality: 'mock' as const,
      source: 'fallback' as const
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number; symbols: string[] } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses
      symbols: Array.from(this.cache.keys())
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update rate limit configuration
   */
  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): {
    requestsThisMinute: number;
    requestsThisHour: number;
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
  } {
    return {
      requestsThisMinute: this.requestCount,
      requestsThisHour: this.hourlyRequestCount,
      maxRequestsPerMinute: this.config.maxRequestsPerMinute,
      maxRequestsPerHour: this.config.maxRequestsPerHour
    };
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const marketDataOptimizer = MarketDataOptimizer.getInstance(); 