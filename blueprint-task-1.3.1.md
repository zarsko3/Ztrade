# Blueprint: Task 1.3.1 - Set up Chart-img API Integration

## Overview
This blueprint outlines the implementation of Chart-img API integration for generating technical analysis charts with candlestick patterns, EMA indicators, and RSI for the Trade-Tracker MVP application.

## Requirements Analysis

### Functional Requirements
- Generate candlestick charts for any stock ticker
- Include EMA-20 and EMA-50 technical indicators
- Display RSI (Relative Strength Index) indicator
- Support multiple timeframes (1D, 1W, 1M, 3M, 1Y)
- Mark trade entry and exit points on charts
- Cache chart images to reduce API calls
- Handle API rate limits and errors gracefully

### Technical Requirements
- Integrate with Chart-img API service
- Implement proper error handling and retry logic
- Set up caching mechanism for chart images
- Create reusable chart service functions
- Add TypeScript types for API responses
- Implement environment variable configuration

## Implementation Plan

### 1. Environment Configuration
- Set up Chart-img API credentials
- Configure API endpoints and parameters
- Set up caching configuration

### 2. API Service Layer
- Create Chart-img API wrapper service
- Implement chart generation functions
- Add error handling and retry logic
- Set up request/response types

### 3. Caching Implementation
- Implement Redis caching for chart images
- Set up cache invalidation strategies
- Add cache hit/miss monitoring

### 4. API Route Implementation
- Create `/api/charts/:ticker` endpoint
- Add query parameter support for timeframes
- Implement trade marker functionality

## Detailed Implementation

### Step 1: Install Required Dependencies

```bash
# Install Redis client for caching
npm install ioredis

# Install chart image processing utilities
npm install sharp

# Install date manipulation library
npm install date-fns
```

### Step 2: Environment Configuration

Create/update `.env.local`:
```env
# Chart-img API Configuration
CHART_IMG_API_KEY=your_chart_img_api_key
CHART_IMG_BASE_URL=https://api.chart-img.com/v1

# Redis Configuration (for caching)
REDIS_URL=your_redis_url
REDIS_PASSWORD=your_redis_password

# Chart Configuration
CHART_CACHE_TTL=3600
CHART_MAX_RETRIES=3
CHART_RETRY_DELAY=1000
```

### Step 3: Create Chart-img API Types

#### src/types/chart.ts
```typescript
export interface ChartRequest {
  ticker: string;
  timeframe: '1D' | '1W' | '1M' | '3M' | '1Y';
  width?: number;
  height?: number;
  indicators?: string[];
  markers?: TradeMarker[];
}

export interface TradeMarker {
  date: string;
  price: number;
  type: 'entry' | 'exit';
  label?: string;
}

export interface ChartResponse {
  url: string;
  expiresAt: string;
  width: number;
  height: number;
}

export interface ChartError {
  code: string;
  message: string;
  details?: any;
}

export interface ChartCacheEntry {
  url: string;
  expiresAt: string;
  createdAt: string;
}
```

### Step 4: Create Chart-img API Service

#### src/services/chart-img-service.ts
```typescript
import Redis from 'ioredis';
import { ChartRequest, ChartResponse, ChartError, ChartCacheEntry } from '@/types/chart';

export class ChartImgService {
  private redis: Redis;
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.apiKey = process.env.CHART_IMG_API_KEY || '';
    this.baseUrl = process.env.CHART_IMG_BASE_URL || 'https://api.chart-img.com/v1';
    this.maxRetries = parseInt(process.env.CHART_MAX_RETRIES || '3');
    this.retryDelay = parseInt(process.env.CHART_RETRY_DELAY || '1000');
  }

  /**
   * Generate a chart URL for a given ticker and timeframe
   */
  async generateChart(request: ChartRequest): Promise<ChartResponse> {
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cached = await this.getCachedChart(cacheKey);
    if (cached) {
      return cached;
    }

    // Generate new chart
    const chartResponse = await this.callChartApi(request);
    
    // Cache the response
    await this.cacheChart(cacheKey, chartResponse);
    
    return chartResponse;
  }

  /**
   * Generate cache key for chart request
   */
  private generateCacheKey(request: ChartRequest): string {
    const { ticker, timeframe, width, height, indicators, markers } = request;
    const key = `chart:${ticker}:${timeframe}:${width || 800}:${height || 600}`;
    
    if (indicators && indicators.length > 0) {
      key += `:${indicators.sort().join(',')}`;
    }
    
    if (markers && markers.length > 0) {
      const markerKey = markers
        .map(m => `${m.date}:${m.price}:${m.type}`)
        .sort()
        .join(',');
      key += `:markers:${markerKey}`;
    }
    
    return key;
  }

  /**
   * Get cached chart if available
   */
  private async getCachedChart(cacheKey: string): Promise<ChartResponse | null> {
    try {
      const cached = await this.redis.get(cacheKey);
      if (!cached) return null;

      const chartEntry: ChartCacheEntry = JSON.parse(cached);
      
      // Check if cache is still valid
      if (new Date(chartEntry.expiresAt) > new Date()) {
        return {
          url: chartEntry.url,
          expiresAt: chartEntry.expiresAt,
          width: 800,
          height: 600
        };
      }
      
      // Remove expired cache
      await this.redis.del(cacheKey);
      return null;
    } catch (error) {
      console.error('Error getting cached chart:', error);
      return null;
    }
  }

  /**
   * Cache chart response
   */
  private async cacheChart(cacheKey: string, chartResponse: ChartResponse): Promise<void> {
    try {
      const cacheEntry: ChartCacheEntry = {
        url: chartResponse.url,
        expiresAt: chartResponse.expiresAt,
        createdAt: new Date().toISOString()
      };

      const ttl = parseInt(process.env.CHART_CACHE_TTL || '3600');
      await this.redis.setex(cacheKey, ttl, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Error caching chart:', error);
    }
  }

  /**
   * Call Chart-img API with retry logic
   */
  private async callChartApi(request: ChartRequest): Promise<ChartResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.makeApiRequest(request);
        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Chart API attempt ${attempt} failed:`, error);
        
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw new Error(`Chart API failed after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Make actual API request to Chart-img
   */
  private async makeApiRequest(request: ChartRequest): Promise<ChartResponse> {
    const { ticker, timeframe, width = 800, height = 600, indicators = [], markers = [] } = request;

    const params = new URLSearchParams({
      symbol: ticker,
      width: width.toString(),
      height: height.toString(),
      timeframe: timeframe,
      indicators: indicators.join(','),
      apikey: this.apiKey
    });

    // Add markers if provided
    if (markers.length > 0) {
      const markerParams = markers.map(m => 
        `${m.date},${m.price},${m.type}${m.label ? `,${m.label}` : ''}`
      );
      params.append('markers', markerParams.join('|'));
    }

    const url = `${this.baseUrl}/stock/chart?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
        headers: {
        'Accept': 'application/json',
        'User-Agent': 'Trade-Tracker-MVP/1.0'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Chart API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    return {
      url: data.url,
      expiresAt: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      width,
      height
    };
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache for a specific ticker
   */
  async clearCache(ticker: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`chart:${ticker}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Error clearing chart cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ hits: number; misses: number; size: number }> {
    try {
      const keys = await this.redis.keys('chart:*');
      return {
        hits: 0, // Would need to implement hit tracking
        misses: 0, // Would need to implement miss tracking
        size: keys.length
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { hits: 0, misses: 0, size: 0 };
    }
  }
}

// Export singleton instance
export const chartImgService = new ChartImgService();
```

### Step 5: Create API Route for Chart Generation

#### src/app/api/charts/[ticker]/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { chartImgService } from '@/services/chart-img-service';
import { ChartRequest } from '@/types/chart';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') as ChartRequest['timeframe'] || '1M';
    const width = parseInt(searchParams.get('width') || '800');
    const height = parseInt(searchParams.get('height') || '600');
    const indicators = searchParams.get('indicators')?.split(',') || ['EMA20', 'EMA50', 'RSI'];
    
    // Parse markers from query parameters
    const markersParam = searchParams.get('markers');
    const markers = markersParam ? JSON.parse(markersParam) : [];

    const chartRequest: ChartRequest = {
      ticker: params.ticker.toUpperCase(),
      timeframe,
      width,
      height,
      indicators,
      markers
    };

    const chartResponse = await chartImgService.generateChart(chartRequest);

    return NextResponse.json(chartResponse);
  } catch (error) {
    console.error('Error generating chart:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate chart',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### Step 6: Create Chart Component

#### src/components/charts/StockChart.tsx
```typescript
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChartRequest, TradeMarker } from '@/types/chart';

interface StockChartProps {
  ticker: string;
  timeframe?: ChartRequest['timeframe'];
  width?: number;
  height?: number;
  markers?: TradeMarker[];
  className?: string;
}

export function StockChart({
  ticker,
  timeframe = '1M',
  width = 800,
  height = 600,
  markers = [],
  className = ''
}: StockChartProps) {
  const [chartUrl, setChartUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateChart();
  }, [ticker, timeframe, width, height, markers]);

  const generateChart = async () => {
      try {
      setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
        timeframe,
        width: width.toString(),
        height: height.toString(),
        indicators: 'EMA20,EMA50,RSI'
      });

      if (markers.length > 0) {
        params.append('markers', JSON.stringify(markers));
      }

      const response = await fetch(`/api/charts/${ticker}?${params.toString()}`);
        
        if (!response.ok) {
        throw new Error(`Failed to generate chart: ${response.statusText}`);
        }
        
        const data = await response.json();
      setChartUrl(data.url);
      } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate chart');
      } finally {
      setLoading(false);
      }
    };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ width, height }}>
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`} style={{ width, height }}>
        <div className="text-red-500 text-center">
          <div className="font-medium">Error loading chart</div>
          <div className="text-sm">{error}</div>
          <button 
            onClick={generateChart}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!chartUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ width, height }}>
        <div className="text-gray-500">No chart available</div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Image
        src={chartUrl}
        alt={`${ticker} chart - ${timeframe}`}
        width={width}
        height={height}
        className="rounded-lg"
        priority
      />
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {ticker} - {timeframe}
      </div>
    </div>
  );
}
```

### Step 7: Create Chart Controls Component

#### src/components/charts/ChartControls.tsx
```typescript
'use client';

import { useState } from 'react';
import { ChartRequest } from '@/types/chart';

interface ChartControlsProps {
  ticker: string;
  currentTimeframe: ChartRequest['timeframe'];
  onTimeframeChange: (timeframe: ChartRequest['timeframe']) => void;
  onRefresh: () => void;
}

export function ChartControls({
  ticker,
  currentTimeframe,
  onTimeframeChange,
  onRefresh
}: ChartControlsProps) {
  const timeframes: { value: ChartRequest['timeframe']; label: string }[] = [
    { value: '1D', label: '1 Day' },
    { value: '1W', label: '1 Week' },
    { value: '1M', label: '1 Month' },
    { value: '3M', label: '3 Months' },
    { value: '1Y', label: '1 Year' }
  ];

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-4">
        <span className="font-medium text-gray-700">{ticker}</span>
        
        <div className="flex space-x-1">
          {timeframes.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onTimeframeChange(value)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                currentTimeframe === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onRefresh}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Refresh Chart
      </button>
    </div>
  );
}
```

### Step 8: Update Environment Types

#### src/types/env.d.ts
```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CHART_IMG_API_KEY: string;
      CHART_IMG_BASE_URL: string;
      REDIS_URL: string;
      REDIS_PASSWORD?: string;
      CHART_CACHE_TTL: string;
      CHART_MAX_RETRIES: string;
      CHART_RETRY_DELAY: string;
    }
  }
}

export {};
```

### Step 9: Create Chart Page for Testing

#### src/app/charts/page.tsx
```typescript
'use client';

import { useState } from 'react';
import { StockChart } from '@/components/charts/StockChart';
import { ChartControls } from '@/components/charts/ChartControls';
import { ChartRequest } from '@/types/chart';

export default function ChartsPage() {
  const [ticker, setTicker] = useState('AAPL');
  const [timeframe, setTimeframe] = useState<ChartRequest['timeframe']>('1M');
  const [key, setKey] = useState(0); // For forcing chart refresh

  const handleTimeframeChange = (newTimeframe: ChartRequest['timeframe']) => {
    setTimeframe(newTimeframe);
  };

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Stock Charts</h1>
      
      <div className="mb-6">
        <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 mb-2">
          Stock Ticker
        </label>
          <input
          id="ticker"
            type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter ticker symbol (e.g., AAPL)"
        />
      </div>
      
      <ChartControls
        ticker={ticker}
        currentTimeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        onRefresh={handleRefresh}
      />

      <div className="mt-6">
        <StockChart
          key={key}
          ticker={ticker}
          timeframe={timeframe}
          width={800}
          height={600}
        />
      </div>
    </div>
  );
}
```

## Testing Strategy

### Unit Tests
- Test chart service functions
- Test cache operations
- Test API request/response handling
- Test error scenarios

### Integration Tests
- Test API endpoint with various parameters
- Test chart component rendering
- Test cache hit/miss scenarios

### Manual Testing
- Test chart generation with different tickers
- Test timeframe switching
- Test marker functionality
- Test error handling and retry logic

## Validation Criteria

### Functional Validation
- [ ] Charts generate successfully for valid tickers
- [ ] Timeframe switching works correctly
- [ ] Technical indicators display properly
- [ ] Trade markers appear on charts
- [ ] Caching reduces API calls
- [ ] Error handling works for invalid tickers

### Performance Validation
- [ ] Chart generation completes within 5 seconds
- [ ] Cached charts load within 1 second
- [ ] API rate limits are respected
- [ ] Memory usage remains reasonable

### Security Validation
- [ ] API keys are properly secured
- [ ] Input validation prevents injection attacks
- [ ] Error messages don't expose sensitive information

## Next Steps

After completing this task:
1. **Task 1.3.2**: Set up market data API for S&P 500 data
2. **Task 1.3.3**: Set up OpenAI GPT-4o API integration
3. **Task 1.3.4**: Configure Upstash Redis for caching
4. **Phase 2**: Begin implementing trade management features 