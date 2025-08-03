import yahooFinance from 'yahoo-finance2';

export interface MarketSentiment {
  overall: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-100
  factors: {
    technical: number; // -100 to 100
    fundamental: number; // -100 to 100
    momentum: number; // -100 to 100
    volatility: number; // -100 to 100
  };
  signals: MarketSignal[];
  summary: string;
}

export interface MarketSignal {
  type: 'buy' | 'sell' | 'hold' | 'alert';
  strength: 'strong' | 'moderate' | 'weak';
  confidence: number; // 0-100
  description: string;
  timeframe: 'short' | 'medium' | 'long';
  indicators: string[];
}

export interface VolatilityForecast {
  current: number;
  forecast: {
    '1d': number;
    '1w': number;
    '1m': number;
  };
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  factors: string[];
}

export interface TrendAnalysis {
  direction: 'uptrend' | 'downtrend' | 'sideways';
  strength: number; // 0-100
  duration: number; // days
  support: number;
  resistance: number;
  breakout: {
    level: number;
    probability: number;
    direction: 'up' | 'down';
  };
}

export interface MarketCondition {
  type: 'trending' | 'ranging' | 'volatile' | 'consolidating';
  description: string;
  characteristics: string[];
  tradingStrategy: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export class MarketAnalysisService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Analyze market sentiment for a given symbol
   */
  async analyzeMarketSentiment(symbol: string): Promise<MarketSentiment> {
    try {
      const [quote, historical] = await Promise.all([
        this.getQuote(symbol),
        this.getHistoricalData(symbol, 30) // Last 30 days
      ]);

      if (!quote || !historical || historical.length === 0) {
        return this.getNeutralSentiment();
      }

      // Technical analysis
      const technicalScore = this.calculateTechnicalScore(historical);
      
      // Fundamental analysis (simplified)
      const fundamentalScore = this.calculateFundamentalScore(quote);
      
      // Momentum analysis
      const momentumScore = this.calculateMomentumScore(historical);
      
      // Volatility analysis
      const volatilityScore = this.calculateVolatilityScore(historical);

      // Overall sentiment calculation
      const overallScore = (technicalScore + fundamentalScore + momentumScore + volatilityScore) / 4;
      
      const overall = overallScore > 20 ? 'bullish' : overallScore < -20 ? 'bearish' : 'neutral';
      const confidence = Math.abs(overallScore);

      // Generate signals
      const signals = this.generateMarketSignals(historical, quote, overallScore);

      // Generate summary
      const summary = this.generateSentimentSummary(overall, confidence, signals);

      return {
        overall,
        confidence: Math.min(100, confidence),
        factors: {
          technical: technicalScore,
          fundamental: fundamentalScore,
          momentum: momentumScore,
          volatility: volatilityScore
        },
        signals,
        summary
      };
    } catch (error) {
      console.error('Error analyzing market sentiment:', error);
      return this.getNeutralSentiment();
    }
  }

  /**
   * Forecast volatility for a given symbol
   */
  async forecastVolatility(symbol: string): Promise<VolatilityForecast> {
    try {
      const historical = await this.getHistoricalData(symbol, 60); // Last 60 days
      
      if (!historical || historical.length === 0) {
        return this.getDefaultVolatilityForecast();
      }

      // Calculate current volatility
      const returns = this.calculateReturns(historical);
      const currentVolatility = this.calculateVolatility(returns);

      // Simple volatility forecasting using historical patterns
      const volatilityTrend = this.analyzeVolatilityTrend(returns);
      
      // Forecast based on trend
      const forecast = {
        '1d': currentVolatility * (1 + volatilityTrend * 0.1),
        '1w': currentVolatility * (1 + volatilityTrend * 0.3),
        '1m': currentVolatility * (1 + volatilityTrend * 0.5)
      };

      const trend = volatilityTrend > 0.1 ? 'increasing' : 
                   volatilityTrend < -0.1 ? 'decreasing' : 'stable';

      const confidence = Math.max(30, 100 - Math.abs(volatilityTrend) * 100);

      return {
        current: currentVolatility,
        forecast,
        trend,
        confidence,
        factors: this.getVolatilityFactors(volatilityTrend, currentVolatility)
      };
    } catch (error) {
      console.error('Error forecasting volatility:', error);
      return this.getDefaultVolatilityForecast();
    }
  }

  /**
   * Analyze market trends for a given symbol
   */
  async analyzeTrend(symbol: string): Promise<TrendAnalysis> {
    try {
      const historical = await this.getHistoricalData(symbol, 90); // Last 90 days
      
      if (!historical || historical.length === 0) {
        return this.getDefaultTrendAnalysis();
      }

      const prices = historical.map(h => h.close);
      
      // Calculate trend direction and strength
      const { direction, strength } = this.calculateTrendDirection(prices);
      
      // Calculate support and resistance levels
      const { support, resistance } = this.calculateSupportResistance(prices);
      
      // Analyze breakout potential
      const breakout = this.analyzeBreakoutPotential(prices, support, resistance);
      
      // Calculate trend duration
      const duration = this.calculateTrendDuration(prices, direction);

      return {
        direction,
        strength,
        duration,
        support,
        resistance,
        breakout
      };
    } catch (error) {
      console.error('Error analyzing trend:', error);
      return this.getDefaultTrendAnalysis();
    }
  }

  /**
   * Determine current market conditions
   */
  async analyzeMarketConditions(symbol: string): Promise<MarketCondition> {
    try {
      const [sentiment, volatility, trend] = await Promise.all([
        this.analyzeMarketSentiment(symbol),
        this.forecastVolatility(symbol),
        this.analyzeTrend(symbol)
      ]);

      // Determine market condition type
      const condition = this.determineMarketCondition(sentiment, volatility, trend);
      
      return condition;
    } catch (error) {
      console.error('Error analyzing market conditions:', error);
      return this.getDefaultMarketCondition();
    }
  }

  /**
   * Get real-time market data with caching
   */
  private async getQuote(symbol: string) {
    const cacheKey = `quote_${symbol}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const quote = await yahooFinance.quote(symbol);
      this.cache.set(cacheKey, { data: quote, timestamp: Date.now() });
      return quote;
    } catch (error) {
      console.error('Error fetching quote:', error);
      return null;
    }
  }

  /**
   * Get historical data with caching
   */
  private async getHistoricalData(symbol: string, days: number) {
    const cacheKey = `historical_${symbol}_${days}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
      
      const chart = await yahooFinance.chart(symbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d'
      });

      const data = chart.quotes?.map((quote: any) => ({
        date: new Date(quote.date),
        open: quote.open || 0,
        high: quote.high || 0,
        low: quote.low || 0,
        close: quote.close || 0,
        volume: quote.volume || 0
      })) || [];

      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return null;
    }
  }

  /**
   * Calculate technical analysis score
   */
  private calculateTechnicalScore(historical: any[]): number {
    if (historical.length < 20) return 0;

    const prices = historical.map(h => h.close);
    const volumes = historical.map(h => h.volume);
    
    // Moving averages
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, Math.min(50, prices.length));
    
    // RSI
    const rsi = this.calculateRSI(prices, 14);
    
    // MACD
    const macd = this.calculateMACD(prices);
    
    // Volume analysis
    const volumeScore = this.analyzeVolume(volumes);
    
    // Combine indicators
    let score = 0;
    
    // Price vs moving averages
    const currentPrice = prices[prices.length - 1];
    if (currentPrice > sma20) score += 20;
    if (currentPrice > sma50) score += 20;
    if (sma20 > sma50) score += 10;
    
    // RSI
    if (rsi > 50 && rsi < 70) score += 15;
    else if (rsi < 30) score -= 15;
    else if (rsi > 70) score -= 10;
    
    // MACD
    if (macd > 0) score += 10;
    else score -= 10;
    
    // Volume
    score += volumeScore;
    
    return Math.max(-100, Math.min(100, score));
  }

  /**
   * Calculate fundamental analysis score
   */
  private calculateFundamentalScore(quote: any): number {
    if (!quote) return 0;
    
    let score = 0;
    
    // Price change
    if (quote.regularMarketChangePercent > 0) {
      score += Math.min(20, quote.regularMarketChangePercent);
    } else {
      score += Math.max(-20, quote.regularMarketChangePercent);
    }
    
    // Volume analysis
    if (quote.regularMarketVolume > quote.averageVolume * 1.5) {
      score += 10;
    } else if (quote.regularMarketVolume < quote.averageVolume * 0.5) {
      score -= 10;
    }
    
    // Market cap (simplified)
    if (quote.marketCap > 10000000000) { // Large cap
      score += 5;
    }
    
    return Math.max(-100, Math.min(100, score));
  }

  /**
   * Calculate momentum score
   */
  private calculateMomentumScore(historical: any[]): number {
    if (historical.length < 10) return 0;
    
    const prices = historical.map(h => h.close);
    
    // Price momentum
    const momentum5 = (prices[prices.length - 1] - prices[prices.length - 6]) / prices[prices.length - 6] * 100;
    const momentum10 = (prices[prices.length - 1] - prices[prices.length - 11]) / prices[prices.length - 11] * 100;
    
    // Rate of change
    const roc = this.calculateROC(prices, 10);
    
    let score = 0;
    
    // Short-term momentum
    if (momentum5 > 2) score += 20;
    else if (momentum5 < -2) score -= 20;
    
    // Medium-term momentum
    if (momentum10 > 5) score += 15;
    else if (momentum10 < -5) score -= 15;
    
    // Rate of change
    if (roc > 0) score += 10;
    else score -= 10;
    
    return Math.max(-100, Math.min(100, score));
  }

  /**
   * Calculate volatility score
   */
  private calculateVolatilityScore(historical: any[]): number {
    if (historical.length < 20) return 0;
    
    const returns = this.calculateReturns(historical);
    const volatility = this.calculateVolatility(returns);
    
    // Normalize volatility (assuming 20% annual volatility is neutral)
    const normalizedVol = (volatility - 0.20) / 0.20 * 100;
    
    // Lower volatility is generally better for trend following
    return Math.max(-100, Math.min(100, -normalizedVol));
  }

  /**
   * Generate market signals
   */
  private generateMarketSignals(historical: any[], quote: any, overallScore: number): MarketSignal[] {
    const signals: MarketSignal[] = [];
    
    // Overall sentiment signal
    if (overallScore > 30) {
      signals.push({
        type: 'buy',
        strength: overallScore > 50 ? 'strong' : 'moderate',
        confidence: Math.min(90, overallScore + 50),
        description: 'Strong bullish sentiment across multiple indicators',
        timeframe: 'medium',
        indicators: ['Technical', 'Momentum', 'Volume']
      });
    } else if (overallScore < -30) {
      signals.push({
        type: 'sell',
        strength: overallScore < -50 ? 'strong' : 'moderate',
        confidence: Math.min(90, Math.abs(overallScore) + 50),
        description: 'Strong bearish sentiment across multiple indicators',
        timeframe: 'medium',
        indicators: ['Technical', 'Momentum', 'Volume']
      });
    }

    // Volume spike signal
    if (quote && quote.regularMarketVolume > quote.averageVolume * 2) {
      signals.push({
        type: overallScore > 0 ? 'buy' : 'sell',
        strength: 'moderate',
        confidence: 70,
        description: 'High volume spike indicating strong interest',
        timeframe: 'short',
        indicators: ['Volume']
      });
    }

    // RSI signals
    const prices = historical.map(h => h.close);
    const rsi = this.calculateRSI(prices, 14);
    
    if (rsi < 30) {
      signals.push({
        type: 'buy',
        strength: 'moderate',
        confidence: 75,
        description: 'Oversold conditions detected',
        timeframe: 'short',
        indicators: ['RSI']
      });
    } else if (rsi > 70) {
      signals.push({
        type: 'sell',
        strength: 'moderate',
        confidence: 75,
        description: 'Overbought conditions detected',
        timeframe: 'short',
        indicators: ['RSI']
      });
    }

    return signals;
  }

  /**
   * Generate sentiment summary
   */
  private generateSentimentSummary(overall: string, confidence: number, signals: MarketSignal[]): string {
    const strength = confidence > 70 ? 'strong' : confidence > 40 ? 'moderate' : 'weak';
    const signalCount = signals.length;
    
    return `Market sentiment is ${strength}ly ${overall} with ${confidence.toFixed(0)}% confidence. ${signalCount} trading signal${signalCount !== 1 ? 's' : ''} detected.`;
  }

  /**
   * Calculate returns from historical data
   */
  private calculateReturns(historical: any[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < historical.length; i++) {
      const return_ = (historical[i].close - historical[i - 1].close) / historical[i - 1].close;
      returns.push(return_);
    }
    return returns;
  }

  /**
   * Calculate volatility
   */
  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  /**
   * Analyze volatility trend
   */
  private analyzeVolatilityTrend(returns: number[]): number {
    if (returns.length < 20) return 0;
    
    const recentVol = this.calculateVolatility(returns.slice(-10));
    const olderVol = this.calculateVolatility(returns.slice(0, -10));
    
    return (recentVol - olderVol) / olderVol;
  }

  /**
   * Calculate trend direction and strength
   */
  private calculateTrendDirection(prices: number[]): { direction: 'uptrend' | 'downtrend' | 'sideways'; strength: number } {
    if (prices.length < 20) return { direction: 'sideways', strength: 0 };
    
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, Math.min(50, prices.length));
    
    const currentPrice = prices[prices.length - 1];
    const priceChange = (currentPrice - prices[0]) / prices[0] * 100;
    
    let direction: 'uptrend' | 'downtrend' | 'sideways';
    let strength = 0;
    
    if (currentPrice > sma20 && sma20 > sma50 && priceChange > 5) {
      direction = 'uptrend';
      strength = Math.min(100, Math.abs(priceChange) * 2);
    } else if (currentPrice < sma20 && sma20 < sma50 && priceChange < -5) {
      direction = 'downtrend';
      strength = Math.min(100, Math.abs(priceChange) * 2);
    } else {
      direction = 'sideways';
      strength = Math.max(0, 50 - Math.abs(priceChange));
    }
    
    return { direction, strength };
  }

  /**
   * Calculate support and resistance levels
   */
  private calculateSupportResistance(prices: number[]): { support: number; resistance: number } {
    const highs = prices.map((_, i) => ({ price: prices[i], index: i }));
    const lows = prices.map((_, i) => ({ price: prices[i], index: i }));
    
    // Find local highs and lows
    const peaks = highs.filter((_, i) => 
      i > 0 && i < highs.length - 1 && 
      highs[i].price > highs[i - 1].price && 
      highs[i].price > highs[i + 1].price
    );
    
    const troughs = lows.filter((_, i) => 
      i > 0 && i < lows.length - 1 && 
      lows[i].price < lows[i - 1].price && 
      lows[i].price < lows[i + 1].price
    );
    
    const resistance = peaks.length > 0 ? Math.max(...peaks.map(p => p.price)) : prices[prices.length - 1] * 1.05;
    const support = troughs.length > 0 ? Math.min(...troughs.map(p => p.price)) : prices[prices.length - 1] * 0.95;
    
    return { support, resistance };
  }

  /**
   * Analyze breakout potential
   */
  private analyzeBreakoutPotential(prices: number[], support: number, resistance: number): { level: number; probability: number; direction: 'up' | 'down' } {
    const currentPrice = prices[prices.length - 1];
    const distanceToResistance = (resistance - currentPrice) / currentPrice;
    const distanceToSupport = (currentPrice - support) / currentPrice;
    
    if (distanceToResistance < 0.02) { // Within 2% of resistance
      return {
        level: resistance,
        probability: 70,
        direction: 'up'
      };
    } else if (distanceToSupport < 0.02) { // Within 2% of support
      return {
        level: support,
        probability: 70,
        direction: 'down'
      };
    }
    
    // Default to resistance breakout
    return {
      level: resistance,
      probability: 30,
      direction: 'up'
    };
  }

  /**
   * Calculate trend duration
   */
  private calculateTrendDuration(prices: number[], direction: 'uptrend' | 'downtrend' | 'sideways'): number {
    if (direction === 'sideways') return 0;
    
    let duration = 0;
    for (let i = prices.length - 1; i > 0; i--) {
      if (direction === 'uptrend' && prices[i] > prices[i - 1]) {
        duration++;
      } else if (direction === 'downtrend' && prices[i] < prices[i - 1]) {
        duration++;
      } else {
        break;
      }
    }
    
    return duration;
  }

  /**
   * Determine market condition
   */
  private determineMarketCondition(sentiment: MarketSentiment, volatility: VolatilityForecast, trend: TrendAnalysis): MarketCondition {
    const isTrending = trend.strength > 70;
    const isVolatile = volatility.current > 0.03; // 3% daily volatility
    const isBullish = sentiment.overall === 'bullish';
    
    if (isTrending && isBullish) {
      return {
        type: 'trending',
        description: 'Strong uptrend with bullish sentiment',
        characteristics: ['Clear direction', 'Strong momentum', 'Above moving averages'],
        tradingStrategy: 'Trend following - buy dips and hold',
        riskLevel: 'medium'
      };
    } else if (isTrending && !isBullish) {
      return {
        type: 'trending',
        description: 'Strong downtrend with bearish sentiment',
        characteristics: ['Clear direction', 'Strong momentum', 'Below moving averages'],
        tradingStrategy: 'Short selling or wait for reversal',
        riskLevel: 'high'
      };
    } else if (isVolatile) {
      return {
        type: 'volatile',
        description: 'High volatility with uncertain direction',
        characteristics: ['Large price swings', 'High volume', 'Uncertain trend'],
        tradingStrategy: 'Range trading with tight stops',
        riskLevel: 'high'
      };
    } else {
      return {
        type: 'consolidating',
        description: 'Low volatility consolidation',
        characteristics: ['Tight range', 'Low volume', 'Sideways movement'],
        tradingStrategy: 'Wait for breakout or range trade',
        riskLevel: 'low'
      };
    }
  }

  // Helper methods for technical indicators
  private calculateSMA(prices: number[], period: number): number {
    const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
    return sum / period;
  }

  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50;
    
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]): number {
    if (prices.length < 26) return 0;
    
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    return ema12 - ema26;
  }

  private calculateEMA(prices: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  private calculateROC(prices: number[], period: number): number {
    if (prices.length < period + 1) return 0;
    
    const currentPrice = prices[prices.length - 1];
    const pastPrice = prices[prices.length - 1 - period];
    
    return ((currentPrice - pastPrice) / pastPrice) * 100;
  }

  private analyzeVolume(volumes: number[]): number {
    if (volumes.length < 20) return 0;
    
    const recentAvg = volumes.slice(-5).reduce((sum, vol) => sum + vol, 0) / 5;
    const historicalAvg = volumes.slice(0, -5).reduce((sum, vol) => sum + vol, 0) / (volumes.length - 5);
    
    const ratio = recentAvg / historicalAvg;
    
    if (ratio > 1.5) return 15; // High volume
    else if (ratio < 0.5) return -15; // Low volume
    else return 0;
  }

  private getVolatilityFactors(trend: number, currentVol: number): string[] {
    const factors: string[] = [];
    
    if (trend > 0.1) factors.push('Increasing volatility trend');
    else if (trend < -0.1) factors.push('Decreasing volatility trend');
    else factors.push('Stable volatility');
    
    if (currentVol > 0.03) factors.push('High current volatility');
    else if (currentVol < 0.01) factors.push('Low current volatility');
    else factors.push('Moderate current volatility');
    
    return factors;
  }

  // Default responses
  private getNeutralSentiment(): MarketSentiment {
    return {
      overall: 'neutral',
      confidence: 0,
      factors: { technical: 0, fundamental: 0, momentum: 0, volatility: 0 },
      signals: [],
      summary: 'Insufficient data for sentiment analysis'
    };
  }

  private getDefaultVolatilityForecast(): VolatilityForecast {
    return {
      current: 0.02,
      forecast: { '1d': 0.02, '1w': 0.02, '1m': 0.02 },
      trend: 'stable',
      confidence: 0,
      factors: ['Insufficient data']
    };
  }

  private getDefaultTrendAnalysis(): TrendAnalysis {
    return {
      direction: 'sideways',
      strength: 0,
      duration: 0,
      support: 0,
      resistance: 0,
      breakout: { level: 0, probability: 0, direction: 'up' }
    };
  }

  private getDefaultMarketCondition(): MarketCondition {
    return {
      type: 'consolidating',
      description: 'Insufficient data for market condition analysis',
      characteristics: ['Limited data'],
      tradingStrategy: 'Wait for more data',
      riskLevel: 'medium'
    };
  }
} 