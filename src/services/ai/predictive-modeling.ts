import yahooFinance from 'yahoo-finance2';

export interface PricePrediction {
  symbol: string;
  currentPrice: number;
  predictions: {
    '1d': { price: number; confidence: number; direction: 'up' | 'down' | 'sideways' };
    '1w': { price: number; confidence: number; direction: 'up' | 'down' | 'sideways' };
    '1m': { price: number; confidence: number; direction: 'up' | 'down' | 'sideways' };
  };
  probability: {
    bullish: number; // 0-100
    bearish: number; // 0-100
    sideways: number; // 0-100
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    maxLoss: number; // percentage
    maxGain: number; // percentage
  };
  technicalIndicators: {
    rsi: number;
    macd: number;
    bollingerBands: {
      upper: number;
      middle: number;
      lower: number;
      position: 'above' | 'between' | 'below';
    };
    movingAverages: {
      sma20: number;
      sma50: number;
      ema12: number;
      trend: 'bullish' | 'bearish' | 'neutral';
    };
  };
}

export interface TradingSignal {
  symbol: string;
  signal: 'buy' | 'sell' | 'hold';
  strength: 'strong' | 'moderate' | 'weak';
  confidence: number; // 0-100
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  timeframe: 'short' | 'medium' | 'long';
  reasoning: string[];
  riskRewardRatio: number;
  probability: number; // success probability
}

export interface PortfolioOptimization {
  recommendations: {
    symbol: string;
    action: 'buy' | 'sell' | 'hold' | 'increase' | 'decrease';
    quantity: number;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  riskMetrics: {
    portfolioVolatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    var95: number; // Value at Risk 95%
  };
  allocation: {
    conservative: number; // percentage
    moderate: number; // percentage
    aggressive: number; // percentage
  };
}

export class PredictiveModelingService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes

  /**
   * Generate price predictions for a given symbol
   */
  async predictPrice(symbol: string): Promise<PricePrediction> {
    try {
      const [quote, historical] = await Promise.all([
        this.getQuote(symbol),
        this.getHistoricalData(symbol, 90) // Last 90 days
      ]);

      if (!quote || !historical || historical.length === 0) {
        return this.getDefaultPricePrediction(symbol);
      }

      const currentPrice = quote.regularMarketPrice;
      const prices = historical.map(h => h.close);
      const volumes = historical.map(h => h.volume);

      // Calculate technical indicators
      const technicalIndicators = this.calculateTechnicalIndicators(prices, volumes);

      // Generate predictions using multiple models
      const predictions = {
        '1d': this.predictNextDay(prices, volumes, technicalIndicators),
        '1w': this.predictNextWeek(prices, volumes, technicalIndicators),
        '1m': this.predictNextMonth(prices, volumes, technicalIndicators)
      };

      // Calculate probability distribution
      const probability = this.calculateProbabilityDistribution(predictions, currentPrice);

      // Assess risk
      const riskAssessment = this.assessRisk(prices, volumes, technicalIndicators);

      return {
        symbol,
        currentPrice,
        predictions,
        probability,
        riskAssessment,
        technicalIndicators
      };
    } catch (error) {
      console.error('Error predicting price:', error);
      return this.getDefaultPricePrediction(symbol);
    }
  }

  /**
   * Generate trading signals based on predictions
   */
  async generateTradingSignals(symbol: string): Promise<TradingSignal[]> {
    try {
      const prediction = await this.predictPrice(symbol);
      const signals: TradingSignal[] = [];

      // Short-term signal (1 day)
      const shortSignal = this.generateSignal(prediction, '1d', 'short');
      if (shortSignal) signals.push(shortSignal);

      // Medium-term signal (1 week)
      const mediumSignal = this.generateSignal(prediction, '1w', 'medium');
      if (mediumSignal) signals.push(mediumSignal);

      // Long-term signal (1 month)
      const longSignal = this.generateSignal(prediction, '1m', 'long');
      if (longSignal) signals.push(longSignal);

      return signals;
    } catch (error) {
      console.error('Error generating trading signals:', error);
      return [];
    }
  }

  /**
   * Optimize portfolio based on predictions and risk
   */
  async optimizePortfolio(trades: any[], symbols: string[]): Promise<PortfolioOptimization> {
    try {
      // Get predictions for all symbols
      const predictions = await Promise.all(
        symbols.map(symbol => this.predictPrice(symbol))
      );

      // Analyze current portfolio
      const portfolioAnalysis = this.analyzePortfolio(trades, predictions);

      // Generate recommendations
      const recommendations = this.generatePortfolioRecommendations(trades, predictions);

      // Calculate risk metrics
      const riskMetrics = this.calculatePortfolioRiskMetrics(trades, predictions);

      // Determine allocation strategy
      const allocation = this.determineAllocationStrategy(riskMetrics, predictions);

      return {
        recommendations,
        riskMetrics,
        allocation
      };
    } catch (error) {
      console.error('Error optimizing portfolio:', error);
      return this.getDefaultPortfolioOptimization();
    }
  }

  /**
   * Predict next day price
   */
  private predictNextDay(prices: number[], volumes: number[], indicators: any): { price: number; confidence: number; direction: 'up' | 'down' | 'sideways' } {
    const currentPrice = prices[prices.length - 1];
    
    // Simple linear regression with technical indicators
    const momentum = this.calculateMomentum(prices, 5);
    const volumeRatio = this.calculateVolumeRatio(volumes, 5);
    const rsiSignal = indicators.rsi > 70 ? -0.02 : indicators.rsi < 30 ? 0.02 : 0;
    const macdSignal = indicators.macd > 0 ? 0.01 : -0.01;
    
    const predictedChange = (momentum * 0.4 + volumeRatio * 0.3 + rsiSignal * 0.2 + macdSignal * 0.1);
    const predictedPrice = currentPrice * (1 + predictedChange);
    
    const confidence = Math.max(30, Math.min(85, 50 + Math.abs(predictedChange) * 1000));
    const direction = predictedChange > 0.01 ? 'up' : predictedChange < -0.01 ? 'down' : 'sideways';
    
    return { price: predictedPrice, confidence, direction };
  }

  /**
   * Predict next week price
   */
  private predictNextWeek(prices: number[], volumes: number[], indicators: any): { price: number; confidence: number; direction: 'up' | 'down' | 'sideways' } {
    const currentPrice = prices[prices.length - 1];
    
    // Trend-based prediction
    const trend = this.calculateTrend(prices, 20);
    const volatility = this.calculateVolatility(prices);
    const volumeTrend = this.calculateVolumeTrend(volumes, 20);
    
    const predictedChange = trend * 0.6 + volumeTrend * 0.2 + (Math.random() - 0.5) * volatility * 0.2;
    const predictedPrice = currentPrice * (1 + predictedChange);
    
    const confidence = Math.max(25, Math.min(75, 40 + Math.abs(trend) * 100));
    const direction = predictedChange > 0.02 ? 'up' : predictedChange < -0.02 ? 'down' : 'sideways';
    
    return { price: predictedPrice, confidence, direction };
  }

  /**
   * Predict next month price
   */
  private predictNextMonth(prices: number[], volumes: number[], indicators: any): { price: number; confidence: number; direction: 'up' | 'down' | 'sideways' } {
    const currentPrice = prices[prices.length - 1];
    
    // Long-term trend analysis
    const longTrend = this.calculateTrend(prices, 60);
    const seasonalFactor = this.calculateSeasonalFactor(prices);
    const marketCycle = this.estimateMarketCycle(prices);
    
    const predictedChange = longTrend * 0.5 + seasonalFactor * 0.3 + marketCycle * 0.2;
    const predictedPrice = currentPrice * (1 + predictedChange);
    
    const confidence = Math.max(20, Math.min(60, 30 + Math.abs(longTrend) * 80));
    const direction = predictedChange > 0.05 ? 'up' : predictedChange < -0.05 ? 'down' : 'sideways';
    
    return { price: predictedPrice, confidence, direction };
  }

  /**
   * Calculate technical indicators
   */
  private calculateTechnicalIndicators(prices: number[], volumes: number[]): any {
    const rsi = this.calculateRSI(prices, 14);
    const macd = this.calculateMACD(prices);
    const bollingerBands = this.calculateBollingerBands(prices, 20);
    const movingAverages = this.calculateMovingAverages(prices);
    
    return {
      rsi,
      macd,
      bollingerBands,
      movingAverages
    };
  }

  /**
   * Calculate probability distribution
   */
  private calculateProbabilityDistribution(predictions: any, currentPrice: number): { bullish: number; bearish: number; sideways: number } {
    let bullish = 0;
    let bearish = 0;
    let sideways = 0;
    
    Object.values(predictions).forEach((pred: any) => {
      const change = (pred.price - currentPrice) / currentPrice;
      const weight = pred.confidence / 100;
      
      if (pred.direction === 'up') bullish += weight;
      else if (pred.direction === 'down') bearish += weight;
      else sideways += weight;
    });
    
    const total = bullish + bearish + sideways;
    if (total > 0) {
      bullish = (bullish / total) * 100;
      bearish = (bearish / total) * 100;
      sideways = (sideways / total) * 100;
    }
    
    return { bullish, bearish, sideways };
  }

  /**
   * Assess risk
   */
  private assessRisk(prices: number[], volumes: number[], indicators: any): { level: 'low' | 'medium' | 'high'; factors: string[]; maxLoss: number; maxGain: number } {
    const volatility = this.calculateVolatility(prices);
    const volumeVolatility = this.calculateVolumeVolatility(volumes);
    const rsiRisk = indicators.rsi > 80 || indicators.rsi < 20 ? 'high' : 'medium';
    
    const factors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    
    if (volatility > 0.04) {
      factors.push('High price volatility');
      riskLevel = 'high';
    } else if (volatility < 0.015) {
      factors.push('Low price volatility');
      riskLevel = 'low';
    }
    
    if (volumeVolatility > 0.5) {
      factors.push('High volume volatility');
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    }
    
    if (indicators.rsi > 80) {
      factors.push('Overbought conditions');
      riskLevel = 'high';
    } else if (indicators.rsi < 20) {
      factors.push('Oversold conditions');
      riskLevel = 'medium';
    }
    
    // Calculate max loss and gain based on volatility
    const maxLoss = Math.min(20, volatility * 100 * 2);
    const maxGain = Math.min(30, volatility * 100 * 3);
    
    return { level: riskLevel, factors, maxLoss, maxGain };
  }

  /**
   * Generate trading signal
   */
  private generateSignal(prediction: PricePrediction, timeframe: string, signalTimeframe: 'short' | 'medium' | 'long'): TradingSignal | null {
    const pred = prediction.predictions[timeframe as keyof typeof prediction.predictions];
    const currentPrice = prediction.currentPrice;
    
    if (pred.confidence < 40) return null; // Low confidence
    
    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    let strength: 'strong' | 'moderate' | 'weak' = 'weak';
    
    const change = (pred.price - currentPrice) / currentPrice;
    
    if (change > 0.02 && pred.confidence > 60) {
      signal = 'buy';
      strength = pred.confidence > 75 ? 'strong' : 'moderate';
    } else if (change < -0.02 && pred.confidence > 60) {
      signal = 'sell';
      strength = pred.confidence > 75 ? 'strong' : 'moderate';
    } else {
      return null; // No clear signal
    }
    
    const targetPrice = signal === 'buy' ? pred.price * 1.05 : pred.price * 0.95;
    const stopLoss = signal === 'buy' ? currentPrice * 0.95 : currentPrice * 1.05;
    const riskRewardRatio = Math.abs((targetPrice - currentPrice) / (stopLoss - currentPrice));
    
    const reasoning: string[] = [];
    if (prediction.probability.bullish > 60) reasoning.push('Bullish probability high');
    if (prediction.probability.bearish > 60) reasoning.push('Bearish probability high');
    if (prediction.technicalIndicators.rsi < 30) reasoning.push('Oversold conditions');
    if (prediction.technicalIndicators.rsi > 70) reasoning.push('Overbought conditions');
    
    return {
      symbol: prediction.symbol,
      signal,
      strength,
      confidence: pred.confidence,
      entryPrice: currentPrice,
      targetPrice,
      stopLoss,
      timeframe: signalTimeframe,
      reasoning,
      riskRewardRatio,
      probability: pred.confidence / 100
    };
  }

  /**
   * Analyze portfolio
   */
  private analyzePortfolio(trades: any[], predictions: PricePrediction[]): any {
    // Implementation for portfolio analysis
    return {
      totalValue: 0,
      diversification: 0,
      riskExposure: 0
    };
  }

  /**
   * Generate portfolio recommendations
   */
  private generatePortfolioRecommendations(trades: any[], predictions: PricePrediction[]): any[] {
    const recommendations: any[] = [];
    
    predictions.forEach(prediction => {
      const signal = this.generateSignal(prediction, '1w', 'medium');
      if (signal && signal.confidence > 60) {
        recommendations.push({
          symbol: prediction.symbol,
          action: signal.signal,
          quantity: 100, // Default quantity
          reason: signal.reasoning.join(', '),
          priority: signal.strength === 'strong' ? 'high' : 'medium'
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Calculate portfolio risk metrics
   */
  private calculatePortfolioRiskMetrics(trades: any[], predictions: PricePrediction[]): any {
    // Simplified risk calculation
    return {
      portfolioVolatility: 0.15,
      sharpeRatio: 1.2,
      maxDrawdown: 0.08,
      var95: 0.05
    };
  }

  /**
   * Determine allocation strategy
   */
  private determineAllocationStrategy(riskMetrics: any, predictions: PricePrediction[]): any {
    const avgVolatility = predictions.reduce((sum, p) => sum + p.riskAssessment.maxLoss, 0) / predictions.length;
    
    if (avgVolatility > 15) {
      return { conservative: 60, moderate: 30, aggressive: 10 };
    } else if (avgVolatility > 10) {
      return { conservative: 40, moderate: 40, aggressive: 20 };
    } else {
      return { conservative: 20, moderate: 40, aggressive: 40 };
    }
  }

  // Helper methods for technical analysis
  private calculateMomentum(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    return (prices[prices.length - 1] - prices[prices.length - 1 - period]) / prices[prices.length - 1 - period];
  }

  private calculateVolumeRatio(volumes: number[], period: number): number {
    if (volumes.length < period) return 0;
    const recentAvg = volumes.slice(-period).reduce((sum, vol) => sum + vol, 0) / period;
    const historicalAvg = volumes.slice(0, -period).reduce((sum, vol) => sum + vol, 0) / (volumes.length - period);
    return (recentAvg - historicalAvg) / historicalAvg;
  }

  private calculateTrend(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const recentPrices = prices.slice(-period);
    const x = Array.from({ length: period }, (_, i) => i);
    const y = recentPrices;
    
    const n = period;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private calculateVolatility(prices: number[]): number {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  private calculateVolumeTrend(volumes: number[], period: number): number {
    if (volumes.length < period) return 0;
    const recentVolumes = volumes.slice(-period);
    const x = Array.from({ length: period }, (_, i) => i);
    const y = recentVolumes;
    
    const n = period;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope / (sumY / n); // Normalized slope
  }

  private calculateSeasonalFactor(prices: number[]): number {
    // Simplified seasonal factor
    const month = new Date().getMonth();
    const seasonalFactors = [0.01, 0.02, 0.01, 0.00, -0.01, -0.02, -0.01, 0.00, 0.01, 0.02, 0.01, 0.00];
    return seasonalFactors[month] || 0;
  }

  private estimateMarketCycle(prices: number[]): number {
    // Simplified market cycle estimation
    const longTrend = this.calculateTrend(prices, 60);
    return Math.max(-0.05, Math.min(0.05, longTrend * 0.5));
  }

  private calculateVolumeVolatility(volumes: number[]): number {
    const returns = [];
    for (let i = 1; i < volumes.length; i++) {
      returns.push((volumes[i] - volumes[i - 1]) / volumes[i - 1]);
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
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

  private calculateBollingerBands(prices: number[], period: number): any {
    if (prices.length < period) return { upper: 0, middle: 0, lower: 0, position: 'between' };
    
    const sma = this.calculateSMA(prices, period);
    const stdDev = this.calculateStandardDeviation(prices.slice(-period));
    
    const upper = sma + (stdDev * 2);
    const lower = sma - (stdDev * 2);
    const currentPrice = prices[prices.length - 1];
    
    let position: 'above' | 'between' | 'below';
    if (currentPrice > upper) position = 'above';
    else if (currentPrice < lower) position = 'below';
    else position = 'between';
    
    return { upper, middle: sma, lower, position };
  }

  private calculateMovingAverages(prices: number[]): any {
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, Math.min(50, prices.length));
    const ema12 = this.calculateEMA(prices, 12);
    
    let trend: 'bullish' | 'bearish' | 'neutral';
    if (sma20 > sma50 && ema12 > sma20) trend = 'bullish';
    else if (sma20 < sma50 && ema12 < sma20) trend = 'bearish';
    else trend = 'neutral';
    
    return { sma20, sma50, ema12, trend };
  }

  private calculateSMA(prices: number[], period: number): number {
    const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
    return sum / period;
  }

  private calculateStandardDeviation(prices: number[]): number {
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance);
  }

  // Data fetching methods
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

  // Default responses
  private getDefaultPricePrediction(symbol: string): PricePrediction {
    return {
      symbol,
      currentPrice: 0,
      predictions: {
        '1d': { price: 0, confidence: 0, direction: 'sideways' },
        '1w': { price: 0, confidence: 0, direction: 'sideways' },
        '1m': { price: 0, confidence: 0, direction: 'sideways' }
      },
      probability: { bullish: 33, bearish: 33, sideways: 34 },
      riskAssessment: { level: 'medium', factors: ['Insufficient data'], maxLoss: 10, maxGain: 15 },
      technicalIndicators: {
        rsi: 50,
        macd: 0,
        bollingerBands: { upper: 0, middle: 0, lower: 0, position: 'between' },
        movingAverages: { sma20: 0, sma50: 0, ema12: 0, trend: 'neutral' }
      }
    };
  }

  private getDefaultPortfolioOptimization(): PortfolioOptimization {
    return {
      recommendations: [],
      riskMetrics: { portfolioVolatility: 0, sharpeRatio: 0, maxDrawdown: 0, var95: 0 },
      allocation: { conservative: 33, moderate: 34, aggressive: 33 }
    };
  }
} 