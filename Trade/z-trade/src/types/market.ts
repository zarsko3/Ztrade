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