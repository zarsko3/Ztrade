import { TradeFeatures, TechnicalIndicators, MarketConditions } from '@/types/ai';
import { Trade } from '@prisma/client';
import * as technicalIndicators from 'technicalindicators';
import { mean, standardDeviation, min, max } from 'simple-statistics';

export class FeatureEngineeringService {
  /**
   * Extract comprehensive features from trade data
   */
  static async extractTradeFeatures(trade: Trade, historicalData?: any[]): Promise<TradeFeatures> {
    const features: TradeFeatures = {
      // Basic trade features
      ticker: trade.ticker,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice || undefined,
      quantity: trade.quantity,
      isShort: trade.isShort,
      
      // Calculated features
      return: trade.exitPrice ? (trade.exitPrice - trade.entryPrice) * trade.quantity : undefined,
      returnPercentage: trade.exitPrice ? ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100 : undefined,
      holdingPeriod: trade.exitDate ? 
        Math.ceil((trade.exitDate.getTime() - trade.entryDate.getTime()) / (1000 * 60 * 60 * 24)) : 
        Math.ceil((new Date().getTime() - trade.entryDate.getTime()) / (1000 * 60 * 60 * 24)),
      
      // Technical features
      technicalIndicators: await this.calculateTechnicalIndicators(trade, historicalData),
      
      // Market features
      marketConditions: await this.extractMarketConditions(trade),
      
      // Behavioral features
      behavioral: await this.extractBehavioralFeatures(trade),
      
      // Temporal features
      temporal: this.extractTemporalFeatures(trade.entryDate),
    };

    return features;
  }

  /**
   * Calculate technical indicators for a trade
   */
  private static async calculateTechnicalIndicators(trade: Trade, historicalData?: any[]): Promise<TechnicalIndicators> {
    if (!historicalData || historicalData.length < 50) {
      // Return default values if insufficient data
      return {
        rsi: 50,
        macd: { macd: 0, signal: 0, histogram: 0 },
        bollingerBands: { upper: 0, middle: 0, lower: 0, width: 0, position: 0.5 },
        movingAverages: { sma20: 0, sma50: 0, sma200: 0, ema12: 0, ema26: 0 },
        volume: { current: 0, average: 0, ratio: 1 },
        support: 0,
        resistance: 0,
      };
    }

    const prices = historicalData.map(d => d.close);
    const volumes = historicalData.map(d => d.volume || 0);
    const highs = historicalData.map(d => d.high);
    const lows = historicalData.map(d => d.low);

    // Calculate RSI
    const rsiValues = technicalIndicators.RSI.calculate({
      values: prices,
      period: 14
    });
    const rsi = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : 50;

    // Calculate MACD
    const macdValues = technicalIndicators.MACD.calculate({
      values: prices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: true,
      SimpleMASignal: true
    });
    const macd = macdValues.length > 0 ? macdValues[macdValues.length - 1] : { MACD: 0, signal: 0, histogram: 0 };

    // Calculate Bollinger Bands
    const bbValues = technicalIndicators.BollingerBands.calculate({
      values: prices,
      period: 20,
      stdDev: 2
    });
    const bb = bbValues.length > 0 ? bbValues[bbValues.length - 1] : { upper: 0, middle: 0, lower: 0 };

    // Calculate Moving Averages
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    const sma200 = this.calculateSMA(prices, 200);
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);

    // Calculate volume metrics
    const currentVolume = volumes[volumes.length - 1] || 0;
    const avgVolume = mean(volumes.slice(-20)) || 0;
    const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;

    // Calculate support and resistance
    const support = this.calculateSupport(lows);
    const resistance = this.calculateResistance(highs);

    // Calculate Bollinger Band position
    const currentPrice = prices[prices.length - 1] || 0;
    const bbPosition = bb.upper !== bb.lower ? 
      (currentPrice - bb.lower) / (bb.upper - bb.lower) : 0.5;

    return {
      rsi,
      macd: {
        macd: macd.MACD || 0,
        signal: macd.signal || 0,
        histogram: macd.histogram || 0,
      },
      bollingerBands: {
        upper: bb.upper || 0,
        middle: bb.middle || 0,
        lower: bb.lower || 0,
        width: bb.upper && bb.lower ? (bb.upper - bb.lower) / bb.middle : 0,
        position: Math.max(0, Math.min(1, bbPosition)),
      },
      movingAverages: {
        sma20,
        sma50,
        sma200,
        ema12,
        ema26,
      },
      volume: {
        current: currentVolume,
        average: avgVolume,
        ratio: volumeRatio,
      },
      support,
      resistance,
    };
  }

  /**
   * Extract market conditions at the time of the trade
   */
  private static async extractMarketConditions(trade: Trade): Promise<MarketConditions> {
    const entryDate = trade.entryDate;
    const hour = entryDate.getHours();
    const dayOfWeek = entryDate.getDay();

    // Determine time of day
    let timeOfDay: MarketConditions['timeOfDay'];
    if (hour < 9) timeOfDay = 'pre_market';
    else if (hour < 11) timeOfDay = 'market_open';
    else if (hour < 13) timeOfDay = 'lunch';
    else if (hour < 16) timeOfDay = 'market_close';
    else timeOfDay = 'after_hours';

    // Determine day of week
    const dayNames: MarketConditions['dayOfWeek'][] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'monday', 'monday'];
    const dayName = dayNames[dayOfWeek] || 'monday';

    // TODO: Fetch actual market data for these values
    // For now, using placeholder values
    return {
      volatility: 0.15, // Placeholder - should be calculated from historical data
      volume: 1.0, // Placeholder - relative volume
      trend: 'sideways', // Placeholder - should be determined from market data
      sector: 'technology', // Placeholder - should be fetched from API
      marketCap: 'large', // Placeholder - should be determined from market cap
      timeOfDay,
      dayOfWeek: dayName,
      economicEvents: [], // Placeholder - should be fetched from economic calendar
      sentiment: 'neutral', // Placeholder - should be calculated from news/social sentiment
      vix: 20, // Placeholder - should be fetched from VIX data
      sp500Return: 0, // Placeholder - should be calculated from S&P 500 data
    };
  }

  /**
   * Extract behavioral features from trade data
   */
  private static async extractBehavioralFeatures(trade: Trade): Promise<TradeFeatures['behavioral']> {
    // TODO: Implement behavioral analysis
    // This would require analyzing the user's trading history
    // For now, returning placeholder values
    return {
      tradeNumber: 1, // Placeholder - should count trades per day
      consecutiveWins: 0, // Placeholder - should track consecutive wins
      consecutiveLosses: 0, // Placeholder - should track consecutive losses
      dailyPnL: 0, // Placeholder - should calculate daily P&L
      weeklyPnL: 0, // Placeholder - should calculate weekly P&L
      positionSize: 0.1, // Placeholder - should calculate relative position size
    };
  }

  /**
   * Extract temporal features from trade date
   */
  private static extractTemporalFeatures(date: Date): TradeFeatures['temporal'] {
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const month = date.getMonth();
    const quarter = Math.floor(month / 3);
    const dayOfMonth = date.getDate();
    const isMonthEnd = dayOfMonth >= 25;
    const isQuarterEnd = isMonthEnd && (month === 2 || month === 5 || month === 8 || month === 11);
    const isYearEnd = month === 11 && dayOfMonth >= 25;

    return {
      hour,
      dayOfWeek,
      month,
      quarter,
      isMonthEnd,
      isQuarterEnd,
      isYearEnd,
    };
  }

  /**
   * Calculate Simple Moving Average
   */
  private static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const recentPrices = prices.slice(-period);
    return mean(recentPrices) || 0;
  }

  /**
   * Calculate Exponential Moving Average
   */
  private static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  /**
   * Calculate support level from recent lows
   */
  private static calculateSupport(lows: number[]): number {
    if (lows.length < 20) return 0;
    const recentLows = lows.slice(-20);
    return min(recentLows) || 0;
  }

  /**
   * Calculate resistance level from recent highs
   */
  private static calculateResistance(highs: number[]): number {
    if (highs.length < 20) return 0;
    const recentHighs = highs.slice(-20);
    return max(recentHighs) || 0;
  }

  /**
   * Calculate volatility from price data
   */
  static calculateVolatility(prices: number[], period: number = 20): number {
    if (prices.length < period + 1) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const recentReturns = returns.slice(-period);
    return standardDeviation(recentReturns) || 0;
  }

  /**
   * Calculate correlation between two arrays
   */
  static calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Normalize features to 0-1 range
   */
  static normalizeFeatures(features: Record<string, number>): Record<string, number> {
    const normalized: Record<string, number> = {};
    
    for (const [key, value] of Object.entries(features)) {
      // Skip non-numeric values
      if (typeof value !== 'number' || isNaN(value)) {
        normalized[key] = 0;
        continue;
      }
      
      // Apply specific normalization rules for different features
      switch (key) {
        case 'rsi':
          normalized[key] = value / 100; // RSI is already 0-100
          break;
        case 'volume_ratio':
          normalized[key] = Math.min(value / 3, 1); // Cap at 3x average volume
          break;
        case 'bb_position':
          normalized[key] = Math.max(0, Math.min(1, value)); // Already 0-1
          break;
        case 'volatility':
          normalized[key] = Math.min(value / 0.5, 1); // Cap at 50% volatility
          break;
        default:
          // For other features, use min-max normalization
          normalized[key] = Math.max(0, Math.min(1, value));
      }
    }
    
    return normalized;
  }

  /**
   * Extract feature vector for ML models
   */
  static extractFeatureVector(features: TradeFeatures): number[] {
    const vector: number[] = [];
    
    // Technical indicators
    vector.push(features.technicalIndicators.rsi / 100);
    vector.push(features.technicalIndicators.macd.macd);
    vector.push(features.technicalIndicators.macd.signal);
    vector.push(features.technicalIndicators.macd.histogram);
    vector.push(features.technicalIndicators.bollingerBands.position);
    vector.push(features.technicalIndicators.volume.ratio);
    
    // Moving averages
    vector.push(features.technicalIndicators.movingAverages.sma20);
    vector.push(features.technicalIndicators.movingAverages.sma50);
    vector.push(features.technicalIndicators.movingAverages.sma200);
    
    // Market conditions
    vector.push(features.marketConditions.volatility);
    vector.push(features.marketConditions.volume);
    vector.push(features.marketConditions.vix / 100);
    
    // Temporal features
    vector.push(features.temporal.hour / 24);
    vector.push(features.temporal.dayOfWeek / 7);
    vector.push(features.temporal.month / 12);
    
    // Behavioral features
    vector.push(features.behavioral.tradeNumber / 10); // Normalize to max 10 trades per day
    vector.push(features.behavioral.consecutiveWins / 10);
    vector.push(features.behavioral.consecutiveLosses / 10);
    vector.push(features.behavioral.positionSize);
    
    return vector;
  }
} 