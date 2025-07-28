// src/lib/env.ts

export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Z-Trade',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  
  // Chart-img API Configuration
  chartImgApiKey: process.env.CHART_IMG_API_KEY || '',
  chartImgBaseUrl: process.env.CHART_IMG_BASE_URL || 'https://api.chart-img.com/v1',
  
  // Redis Configuration
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisPassword: process.env.REDIS_PASSWORD,
  
  // Chart Configuration
  chartCacheTtl: parseInt(process.env.CHART_CACHE_TTL || '3600'),
  chartMaxRetries: parseInt(process.env.CHART_MAX_RETRIES || '3'),
  chartRetryDelay: parseInt(process.env.CHART_RETRY_DELAY || '1000'),
  
  // Alpha Vantage API Configuration
  alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY || '',
  alphaVantageBaseUrl: process.env.ALPHA_VANTAGE_BASE_URL || 'https://www.alphavantage.co/query',
  
  // Market Data Configuration
  marketDataCacheTtl: parseInt(process.env.MARKET_DATA_CACHE_TTL || '1800'),
  marketDataMaxRetries: parseInt(process.env.MARKET_DATA_MAX_RETRIES || '3'),
  marketDataRetryDelay: parseInt(process.env.MARKET_DATA_RETRY_DELAY || '1000'),
  
  // Add validation
  isValid(): boolean {
    return (
      Boolean(this.appName) &&
      (!this.isProduction || Boolean(this.apiUrl)) &&
      Boolean(this.DATABASE_URL) &&
      Boolean(this.chartImgApiKey) &&
      Boolean(this.chartImgBaseUrl) &&
      Boolean(this.redisUrl) &&
      Boolean(this.redisPassword) &&
              Boolean(this.chartCacheTtl) &&
        Boolean(this.chartMaxRetries) &&
        Boolean(this.chartRetryDelay) &&
        Boolean(this.alphaVantageApiKey) &&
        Boolean(this.alphaVantageBaseUrl) &&
        Boolean(this.marketDataCacheTtl) &&
        Boolean(this.marketDataMaxRetries) &&
        Boolean(this.marketDataRetryDelay)
    );
  },
}; 