import { env } from '@/lib/env';

export interface AlphaVantageQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
  lastUpdated: string;
  dataQuality: 'live' | 'cached' | 'mock';
  source: 'alpha-vantage' | 'cache' | 'fallback';
}

export interface AlphaVantageHistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AlphaVantageApiResponse {
  'Meta Data'?: {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Output Size': string;
    '5. Time Zone': string;
  };
  'Time Series (Daily)'?: {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    };
  };
  'Global Quote'?: {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
  'Note'?: string;
  'Error Message'?: string;
}

class AlphaVantageService {
  private static instance: AlphaVantageService;
  private cache: Map<string, { data: AlphaVantageQuote; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 60 * 1000; // 1 minute cache (Alpha Vantage rate limits)
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 12000; // 12 seconds between requests (5 per minute limit)

  static getInstance(): AlphaVantageService {
    if (!AlphaVantageService.instance) {
      AlphaVantageService.instance = new AlphaVantageService();
    }
    return AlphaVantageService.instance;
  }

  /**
   * Get current quote for a symbol
   */
  async getQuote(symbol: string): Promise<AlphaVantageQuote> {
    const cacheKey = `quote-${symbol}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return { ...cached.data, dataQuality: 'cached' as const };
    }

    try {
      await this.checkRateLimit();

      const apiKey = env.alphaVantageApiKey;
      if (!apiKey) {
        console.warn('Alpha Vantage API key not configured, using fallback data');
        return this.createFallbackQuote(symbol);
      }

      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status}`);
      }

      const data: AlphaVantageApiResponse = await response.json();

      if (data['Error Message']) {
        throw new Error(`Alpha Vantage API error: ${data['Error Message']}`);
      }

      if (data['Note']) {
        console.warn('Alpha Vantage rate limit reached:', data['Note']);
        return this.createFallbackQuote(symbol);
      }

      const globalQuote = data['Global Quote'];
      if (!globalQuote) {
        throw new Error('No quote data received from Alpha Vantage');
      }

      const quote: AlphaVantageQuote = {
        symbol: globalQuote['01. symbol'],
        price: parseFloat(globalQuote['05. price']),
        change: parseFloat(globalQuote['09. change']),
        changePercent: parseFloat(globalQuote['10. change percent'].replace('%', '')),
        volume: parseInt(globalQuote['06. volume']),
        timestamp: new Date().toISOString(),
        lastUpdated: globalQuote['07. latest trading day'],
        dataQuality: 'live',
        source: 'alpha-vantage'
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: quote,
        timestamp: Date.now()
      });

      this.requestCount++;
      this.lastRequestTime = Date.now();

      return quote;
    } catch (error) {
      console.error(`Error fetching Alpha Vantage quote for ${symbol}:`, error);
      return this.createFallbackQuote(symbol);
    }
  }

  /**
   * Get historical data for a symbol
   */
  async getHistoricalData(
    symbol: string, 
    startDate: string, 
    endDate: string
  ): Promise<AlphaVantageHistoricalData[]> {
    try {
      await this.checkRateLimit();

      const apiKey = env.alphaVantageApiKey;
      if (!apiKey) {
        console.warn('Alpha Vantage API key not configured, using fallback data');
        return this.createFallbackHistoricalData(startDate, endDate);
      }

      const response = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status}`);
      }

      const data: AlphaVantageApiResponse = await response.json();

      if (data['Error Message']) {
        throw new Error(`Alpha Vantage API error: ${data['Error Message']}`);
      }

      if (data['Note']) {
        console.warn('Alpha Vantage rate limit reached:', data['Note']);
        return this.createFallbackHistoricalData(startDate, endDate);
      }

      const timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) {
        throw new Error('No historical data received from Alpha Vantage');
      }

      const historicalData: AlphaVantageHistoricalData[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (const [date, values] of Object.entries(timeSeries)) {
        const dataDate = new Date(date);
        if (dataDate >= start && dataDate <= end) {
          historicalData.push({
            date: date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume'])
          });
        }
      }

      // Sort by date
      historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      this.requestCount++;
      this.lastRequestTime = Date.now();

      return historicalData;
    } catch (error) {
      console.error(`Error fetching Alpha Vantage historical data for ${symbol}:`, error);
      return this.createFallbackHistoricalData(startDate, endDate);
    }
  }

  /**
   * Check rate limits and enforce delays
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const delay = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
      console.log(`Alpha Vantage rate limit: waiting ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Create fallback quote data
   */
  private createFallbackQuote(symbol: string): AlphaVantageQuote {
    const fallbackPrices: { [key: string]: number } = {
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

    const basePrice = fallbackPrices[symbol] || 100;
    const change = (Math.random() - 0.5) * 10; // Random change between -5 and +5
    const changePercent = (change / basePrice) * 100;

    return {
      symbol,
      price: basePrice + change,
      change,
      changePercent,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString().split('T')[0],
      dataQuality: 'mock',
      source: 'fallback'
    };
  }

  /**
   * Create fallback historical data
   */
  private createFallbackHistoricalData(startDate: string, endDate: string): AlphaVantageHistoricalData[] {
    const data: AlphaVantageHistoricalData[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const basePrice = 100;

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
        const change = (Math.random() - 0.5) * 4; // Random daily change
        const open = basePrice + change;
        const high = open + Math.random() * 2;
        const low = open - Math.random() * 2;
        const close = open + (Math.random() - 0.5) * 2;

        data.push({
          date: date.toISOString().split('T')[0],
          open,
          high,
          low,
          close,
          volume: Math.floor(Math.random() * 1000000) + 100000
        });
      }
    }

    return data;
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): {
    requestsToday: number;
    lastRequestTime: string;
    rateLimitDelay: number;
  } {
    return {
      requestsToday: this.requestCount,
      lastRequestTime: new Date(this.lastRequestTime).toISOString(),
      rateLimitDelay: this.RATE_LIMIT_DELAY
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Reset request counter (call daily)
   */
  resetRequestCount(): void {
    this.requestCount = 0;
  }
}

export const alphaVantageService = AlphaVantageService.getInstance(); 