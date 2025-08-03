# Blueprint: Task 1.3.2 - Set up Market Data API for S&P 500 Data

## Overview
This blueprint outlines the implementation of market data API integration for retrieving S&P 500 data and other market indices to enable trade benchmarking and performance comparison in the Trade-Tracker MVP application.

## Requirements Analysis

### Functional Requirements
- Retrieve real-time S&P 500 index data
- Get historical S&P 500 performance data
- Calculate S&P 500 returns for specific time periods
- Compare trade performance against S&P 500 benchmark
- Cache market data to reduce API calls
- Handle API rate limits and errors gracefully
- Support multiple market indices (S&P 500, NASDAQ, DOW)

### Technical Requirements
- Integrate with Alpha Vantage API (or similar)
- Implement proper error handling and retry logic
- Set up caching mechanism for market data
- Create reusable market data service functions
- Add TypeScript types for API responses
- Implement environment variable configuration

## Implementation Plan

### 1. Environment Configuration
- Set up Alpha Vantage API credentials
- Configure API endpoints and parameters
- Set up caching configuration

### 2. API Service Layer
- Create market data API wrapper service
- Implement S&P 500 data retrieval functions
- Add error handling and retry logic
- Set up request/response types

### 3. Caching Implementation
- Implement Redis caching for market data
- Set up cache invalidation strategies
- Add cache hit/miss monitoring

### 4. API Route Implementation
- Create `/api/market/sp500` endpoint
- Add query parameter support for time periods
- Implement performance calculation functionality

## Detailed Implementation

### Step 1: Install Required Dependencies

```bash
# Install additional utilities for date handling and calculations
npm install moment
npm install axios
```

### Step 2: Environment Configuration

Update `.env.local`:
```env
# Alpha Vantage API Configuration
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
ALPHA_VANTAGE_BASE_URL=https://www.alphavantage.co/query

# Market Data Configuration
MARKET_DATA_CACHE_TTL=1800
MARKET_DATA_MAX_RETRIES=3
MARKET_DATA_RETRY_DELAY=1000
```

### Step 3: Create Market Data Types

#### src/types/market.ts
```typescript
export interface MarketDataRequest {
  symbol: string;
  function: 'TIME_SERIES_DAILY' | 'TIME_SERIES_WEEKLY' | 'TIME_SERIES_MONTHLY';
  outputsize?: 'compact' | 'full';
}

export interface MarketDataResponse {
  symbol: string;
  lastRefreshed: string;
  timeZone: string;
  data: MarketDataPoint[];
}

export interface MarketDataPoint {
  date: string;
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
  lastUpdated: string;
  historicalData: MarketDataPoint[];
}

export interface PerformanceComparison {
  tradeReturn: number;
  sp500Return: number;
  outperformance: number;
  period: string;
  startDate: string;
  endDate: string;
}

export interface MarketError {
  code: string;
  message: string;
  details?: any;
}

export interface MarketCacheEntry {
  data: any;
  expiresAt: string;
  createdAt: string;
}
```

### Step 4: Create Market Data Service

#### src/services/market-data-service.ts
```typescript
import Redis from 'ioredis';
import axios from 'axios';
import moment from 'moment';
import { 
  MarketDataRequest, 
  MarketDataResponse, 
  SP500Data, 
  PerformanceComparison,
  MarketError,
  MarketCacheEntry 
} from '@/types/market';

export class MarketDataService {
  private redis: Redis;
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;
  private retryDelay: number;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    this.baseUrl = process.env.ALPHA_VANTAGE_BASE_URL || 'https://www.alphavantage.co/query';
    this.maxRetries = parseInt(process.env.MARKET_DATA_MAX_RETRIES || '3');
    this.retryDelay = parseInt(process.env.MARKET_DATA_RETRY_DELAY || '1000');
  }

  /**
   * Get current S&P 500 data
   */
  async getSP500Data(): Promise<SP500Data> {
    const cacheKey = 'market:sp500:current';
    
    // Check cache first
    const cached = await this.getCachedMarketData(cacheKey);
    if (cached) {
      return cached as SP500Data;
    }

    // Fetch new data
    const data = await this.fetchSP500Data();
    
    // Cache the response
    await this.cacheMarketData(cacheKey, data);
    
    return data;
  }

  /**
   * Get S&P 500 historical data for a specific period
   */
  async getSP500HistoricalData(
    startDate: string,
    endDate: string
  ): Promise<MarketDataPoint[]> {
    const cacheKey = `market:sp500:historical:${startDate}:${endDate}`;
    
    // Check cache first
    const cached = await this.getCachedMarketData(cacheKey);
    if (cached) {
      return cached as MarketDataPoint[];
    }

    // Fetch new data
    const data = await this.fetchSP500HistoricalData(startDate, endDate);
    
    // Cache the response
    await this.cacheMarketData(cacheKey, data);
    
    return data;
  }

  /**
   * Calculate S&P 500 return for a specific period
   */
  async calculateSP500Return(
    startDate: string,
    endDate: string
  ): Promise<number> {
    const historicalData = await this.getSP500HistoricalData(startDate, endDate);
    
    if (historicalData.length < 2) {
      throw new Error('Insufficient data for return calculation');
    }

    const startPrice = historicalData[0].close;
    const endPrice = historicalData[historicalData.length - 1].close;
    
    return ((endPrice - startPrice) / startPrice) * 100;
  }

  /**
   * Compare trade performance against S&P 500
   */
  async compareTradePerformance(
    tradeStartDate: string,
    tradeEndDate: string,
    tradeReturn: number
  ): Promise<PerformanceComparison> {
    const sp500Return = await this.calculateSP500Return(tradeStartDate, tradeEndDate);
    
    return {
      tradeReturn,
      sp500Return,
      outperformance: tradeReturn - sp500Return,
      period: `${tradeStartDate} to ${tradeEndDate}`,
      startDate: tradeStartDate,
      endDate: tradeEndDate
    };
  }

  /**
   * Fetch S&P 500 current data from API
   */
  private async fetchSP500Data(): Promise<SP500Data> {
    const response = await this.callMarketApi({
      symbol: 'SPY', // S&P 500 ETF as proxy
      function: 'TIME_SERIES_DAILY',
      outputsize: 'compact'
    });

    const timeSeries = response['Time Series (Daily)'];
    const dates = Object.keys(timeSeries).sort().reverse();
    const latestDate = dates[0];
    const previousDate = dates[1];

    const latestData = timeSeries[latestDate];
    const previousData = timeSeries[previousDate];

    const currentPrice = parseFloat(latestData['4. close']);
    const previousPrice = parseFloat(previousData['4. close']);
    const change = currentPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;

    return {
      symbol: 'S&P 500',
      currentPrice,
      change,
      changePercent,
      lastUpdated: latestDate,
      historicalData: dates.slice(0, 30).map(date => ({
        date,
        open: parseFloat(timeSeries[date]['1. open']),
        high: parseFloat(timeSeries[date]['2. high']),
        low: parseFloat(timeSeries[date]['3. low']),
        close: parseFloat(timeSeries[date]['4. close']),
        volume: parseInt(timeSeries[date]['5. volume'])
      }))
    };
  }

  /**
   * Fetch S&P 500 historical data from API
   */
  private async fetchSP500HistoricalData(
    startDate: string,
    endDate: string
  ): Promise<MarketDataPoint[]> {
    const response = await this.callMarketApi({
      symbol: 'SPY',
      function: 'TIME_SERIES_DAILY',
      outputsize: 'full'
    });

    const timeSeries = response['Time Series (Daily)'];
    const dates = Object.keys(timeSeries).sort();
    
    return dates
      .filter(date => date >= startDate && date <= endDate)
      .map(date => ({
        date,
        open: parseFloat(timeSeries[date]['1. open']),
        high: parseFloat(timeSeries[date]['2. high']),
        low: parseFloat(timeSeries[date]['3. low']),
        close: parseFloat(timeSeries[date]['4. close']),
        volume: parseInt(timeSeries[date]['5. volume'])
      }));
  }

  /**
   * Call market API with retry logic
   */
  private async callMarketApi(request: MarketDataRequest): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.makeApiRequest(request);
        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Market API attempt ${attempt} failed:`, error);
        
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw new Error(`Market API failed after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Make actual API request to Alpha Vantage
   */
  private async makeApiRequest(request: MarketDataRequest): Promise<any> {
    const params = new URLSearchParams({
      function: request.function,
      symbol: request.symbol,
      apikey: this.apiKey,
      ...(request.outputsize && { outputsize: request.outputsize })
    });

    const url = `${this.baseUrl}?${params.toString()}`;
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Trade-Tracker-MVP/1.0'
      }
    });

    if (response.data['Error Message']) {
      throw new Error(`API Error: ${response.data['Error Message']}`);
    }

    if (response.data['Note']) {
      throw new Error(`API Rate Limit: ${response.data['Note']}`);
    }

    return response.data;
  }

  /**
   * Get cached market data
   */
  private async getCachedMarketData(cacheKey: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(cacheKey);
      if (!cached) return null;

      const cacheEntry: MarketCacheEntry = JSON.parse(cached);
      
      if (new Date(cacheEntry.expiresAt) > new Date()) {
        return cacheEntry.data;
      }
      
      await this.redis.del(cacheKey);
      return null;
    } catch (error) {
      console.error('Error getting cached market data:', error);
      return null;
    }
  }

  /**
   * Cache market data
   */
  private async cacheMarketData(cacheKey: string, data: any): Promise<void> {
    try {
      const cacheEntry: MarketCacheEntry = {
        data,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        createdAt: new Date().toISOString()
      };

      const ttl = parseInt(process.env.MARKET_DATA_CACHE_TTL || '1800');
      await this.redis.setex(cacheKey, ttl, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Error caching market data:', error);
    }
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache for market data
   */
  async clearMarketCache(): Promise<void> {
    try {
      const keys = await this.redis.keys('market:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Error clearing market cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ hits: number; misses: number; size: number }> {
    try {
      const keys = await this.redis.keys('market:*');
      return {
        hits: 0,
        misses: 0,
        size: keys.length
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { hits: 0, misses: 0, size: 0 };
    }
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();
```

### Step 5: Create API Routes

#### src/app/api/market/sp500/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { marketDataService } from '@/services/market-data-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'current';
    
    switch (action) {
      case 'current':
        const currentData = await marketDataService.getSP500Data();
        return NextResponse.json(currentData);
        
      case 'historical':
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        
        if (!startDate || !endDate) {
      return NextResponse.json(
            { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }
    
        const historicalData = await marketDataService.getSP500HistoricalData(startDate, endDate);
        return NextResponse.json(historicalData);
        
      case 'return':
        const returnStartDate = searchParams.get('startDate');
        const returnEndDate = searchParams.get('endDate');
        
        if (!returnStartDate || !returnEndDate) {
      return NextResponse.json(
            { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }
    
        const returnData = await marketDataService.calculateSP500Return(returnStartDate, returnEndDate);
        return NextResponse.json({ return: returnData });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: current, historical, or return' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in SP500 API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch S&P 500 data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### Step 6: Create Market Data Components

#### src/components/market/SP500Widget.tsx
```typescript
'use client';

import { useState, useEffect } from 'react';
import { SP500Data } from '@/types/market';

interface SP500WidgetProps {
  className?: string;
}

export function SP500Widget({ className = '' }: SP500WidgetProps) {
  const [data, setData] = useState<SP500Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSP500Data();
  }, []);

  const fetchSP500Data = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/market/sp500?action=current');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch S&P 500 data: ${response.statusText}`);
      }

      const sp500Data = await response.json();
      setData(sp500Data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch S&P 500 data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="text-red-600">
          <div className="font-medium">Error loading S&P 500 data</div>
          <div className="text-sm">{error}</div>
          <button 
            onClick={fetchSP500Data}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="text-gray-500">No S&P 500 data available</div>
      </div>
    );
  }

  const isPositive = data.change >= 0;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{data.symbol}</h3>
        <span className="text-sm text-gray-500">
          Updated: {new Date(data.lastUpdated).toLocaleDateString()}
        </span>
      </div>
      
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold text-gray-900">
          ${data.currentPrice.toFixed(2)}
        </span>
        <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{data.change.toFixed(2)} ({isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%)
        </span>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
}
```

### Step 7: Create Test Script

#### scripts/test-market-api.ts
```typescript
import { marketDataService } from '../src/services/market-data-service';
import moment from 'moment';

async function testMarketService() {
  console.log('Testing Market Data Service...\n');

  try {
    // Test current S&P 500 data
    console.log('1. Testing current S&P 500 data...');
    const currentData = await marketDataService.getSP500Data();
    console.log('✅ Current S&P 500 data:', {
      symbol: currentData.symbol,
      currentPrice: currentData.currentPrice,
      change: currentData.change,
      changePercent: currentData.changePercent
    });

    // Test historical data
    console.log('\n2. Testing historical S&P 500 data...');
    const endDate = moment().format('YYYY-MM-DD');
    const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
    
    const historicalData = await marketDataService.getSP500HistoricalData(startDate, endDate);
    console.log('✅ Historical data points:', historicalData.length);

    // Test return calculation
    console.log('\n3. Testing return calculation...');
    const returnData = await marketDataService.calculateSP500Return(startDate, endDate);
    console.log('✅ S&P 500 return:', returnData.toFixed(2) + '%');

    // Test performance comparison
    console.log('\n4. Testing performance comparison...');
    const comparison = await marketDataService.compareTradePerformance(
      startDate,
      endDate,
      5.5 // Sample trade return
    );
    console.log('✅ Performance comparison:', comparison);

    // Test cache operations
    console.log('\n5. Testing cache operations...');
    const stats = await marketDataService.getCacheStats();
    console.log('✅ Cache stats:', stats);

    console.log('\n🎉 All market data tests passed!');
  } catch (error) {
    console.error('❌ Market data test failed:', error);
  }
}

// Run the test
testMarketService().catch(console.error);
```

## Testing Strategy

### Unit Tests
- Test market data service functions
- Test cache operations
- Test API request/response handling
- Test error scenarios

### Integration Tests
- Test API endpoint with various parameters
- Test S&P 500 widget component
- Test cache hit/miss scenarios

### Manual Testing
- Test S&P 500 data retrieval
- Test historical data fetching
- Test return calculations
- Test performance comparisons

## Validation Criteria

### Functional Validation
- [ ] S&P 500 current data retrieves successfully
- [ ] Historical data fetches for specified periods
- [ ] Return calculations are accurate
- [ ] Performance comparisons work correctly
- [ ] Caching reduces API calls
- [ ] Error handling works for API failures

### Performance Validation
- [ ] Data retrieval completes within 5 seconds
- [ ] Cached data loads within 1 second
- [ ] API rate limits are respected
- [ ] Memory usage remains reasonable

### Security Validation
- [ ] API keys are properly secured
- [ ] Input validation prevents injection attacks
- [ ] Error messages don't expose sensitive information

## Next Steps

After completing this task:
1. **Task 1.3.3**: Set up OpenAI GPT-4o API integration
2. **Task 1.3.4**: Configure Upstash Redis for caching
3. **Phase 2**: Begin implementing trade management features 