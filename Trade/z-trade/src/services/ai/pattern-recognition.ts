import { TradeWithCalculations } from '@/types/trade';

export interface TradingPattern {
  id: string;
  type: 'trend_following' | 'mean_reversion' | 'breakout' | 'volume';
  name: string;
  confidence: number;
  trades: TradeWithCalculations[];
  description: string;
  performance: {
    winRate: number;
    avgReturn: number;
    totalTrades: number;
  };
  metadata: {
    startDate: string;
    endDate: string;
    patternStrength: number;
    marketConditions: string;
  };
}

export interface PatternDetectionResult {
  patterns: TradingPattern[];
  summary: {
    totalPatterns: number;
    mostProfitablePattern: string;
    averageConfidence: number;
    patternDistribution: Record<string, number>;
  };
}

export class PatternRecognitionService {
  /**
   * Detect trading patterns in a set of trades
   */
  async detectPatterns(trades: TradeWithCalculations[]): Promise<PatternDetectionResult> {
    const patterns: TradingPattern[] = [];
    
    // Filter for closed trades only
    const closedTrades = trades.filter(trade => !trade.isOpen);
    
    if (closedTrades.length < 3) {
      return {
        patterns: [],
        summary: {
          totalPatterns: 0,
          mostProfitablePattern: 'None',
          averageConfidence: 0,
          patternDistribution: {}
        }
      };
    }

    // Detect different pattern types
    const trendPatterns = this.detectTrendFollowingPatterns(closedTrades);
    const meanReversionPatterns = this.detectMeanReversionPatterns(closedTrades);
    const breakoutPatterns = this.detectBreakoutPatterns(closedTrades);
    const volumePatterns = this.detectVolumePatterns(closedTrades);

    patterns.push(...trendPatterns, ...meanReversionPatterns, ...breakoutPatterns, ...volumePatterns);

    return {
      patterns,
      summary: this.generatePatternSummary(patterns)
    };
  }

  /**
   * Detect trend following patterns
   */
  private detectTrendFollowingPatterns(trades: TradeWithCalculations[]): TradingPattern[] {
    const patterns: TradingPattern[] = [];
    
    // Group trades by ticker
    const tradesByTicker = this.groupTradesByTicker(trades);
    
    for (const [ticker, tickerTrades] of Object.entries(tradesByTicker)) {
      if (tickerTrades.length < 3) continue;
      
      // Sort by entry date
      const sortedTrades = tickerTrades.sort((a, b) => 
        new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
      );

      // Detect uptrend patterns
      const uptrendPattern = this.detectUptrend(sortedTrades);
      if (uptrendPattern) patterns.push(uptrendPattern);

      // Detect downtrend patterns
      const downtrendPattern = this.detectDowntrend(sortedTrades);
      if (downtrendPattern) patterns.push(downtrendPattern);
    }

    return patterns;
  }

  /**
   * Detect uptrend patterns
   */
  private detectUptrend(trades: TradeWithCalculations[]): TradingPattern | null {
    if (trades.length < 3) return null;

    // Check if prices are consistently increasing
    let consecutiveIncreases = 0;
    let totalReturn = 0;
    let winningTrades = 0;

    for (let i = 1; i < trades.length; i++) {
      const prevTrade = trades[i - 1];
      const currentTrade = trades[i];
      
      if (currentTrade.entryPrice > prevTrade.entryPrice) {
        consecutiveIncreases++;
      } else {
        consecutiveIncreases = 0;
      }

      if (currentTrade.profitLoss && currentTrade.profitLoss > 0) {
        winningTrades++;
      }
      if (currentTrade.profitLoss) {
        totalReturn += currentTrade.profitLoss;
      }
    }

    const confidence = Math.min(consecutiveIncreases / trades.length, 1);
    const winRate = winningTrades / trades.length;
    const avgReturn = totalReturn / trades.length;

    if (confidence >= 0.6 && winRate >= 0.5) {
      return {
        id: `uptrend_${trades[0].ticker}_${Date.now()}`,
        type: 'trend_following',
        name: 'Uptrend Pattern',
        confidence,
        trades,
        description: `Consistent uptrend pattern with ${(confidence * 100).toFixed(1)}% price increases and ${(winRate * 100).toFixed(1)}% win rate`,
        performance: {
          winRate,
          avgReturn,
          totalTrades: trades.length
        },
        metadata: {
          startDate: new Date(trades[0].entryDate).toISOString(),
          endDate: new Date(trades[trades.length - 1].entryDate).toISOString(),
          patternStrength: confidence,
          marketConditions: 'Bullish trend'
        }
      };
    }

    return null;
  }

  /**
   * Detect downtrend patterns
   */
  private detectDowntrend(trades: TradeWithCalculations[]): TradingPattern | null {
    if (trades.length < 3) return null;

    // Check if prices are consistently decreasing
    let consecutiveDecreases = 0;
    let totalReturn = 0;
    let winningTrades = 0;

    for (let i = 1; i < trades.length; i++) {
      const prevTrade = trades[i - 1];
      const currentTrade = trades[i];
      
      if (currentTrade.entryPrice < prevTrade.entryPrice) {
        consecutiveDecreases++;
      } else {
        consecutiveDecreases = 0;
      }

      if (currentTrade.profitLoss && currentTrade.profitLoss > 0) {
        winningTrades++;
      }
      if (currentTrade.profitLoss) {
        totalReturn += currentTrade.profitLoss;
      }
    }

    const confidence = Math.min(consecutiveDecreases / trades.length, 1);
    const winRate = winningTrades / trades.length;
    const avgReturn = totalReturn / trades.length;

    if (confidence >= 0.6 && winRate >= 0.5) {
      return {
        id: `downtrend_${trades[0].ticker}_${Date.now()}`,
        type: 'trend_following',
        name: 'Downtrend Pattern',
        confidence,
        trades,
        description: `Consistent downtrend pattern with ${(confidence * 100).toFixed(1)}% price decreases and ${(winRate * 100).toFixed(1)}% win rate`,
        performance: {
          winRate,
          avgReturn,
          totalTrades: trades.length
        },
        metadata: {
          startDate: new Date(trades[0].entryDate).toISOString(),
          endDate: new Date(trades[trades.length - 1].entryDate).toISOString(),
          patternStrength: confidence,
          marketConditions: 'Bearish trend'
        }
      };
    }

    return null;
  }

  /**
   * Detect mean reversion patterns
   */
  private detectMeanReversionPatterns(trades: TradeWithCalculations[]): TradingPattern[] {
    const patterns: TradingPattern[] = [];
    
    // Group trades by ticker
    const tradesByTicker = this.groupTradesByTicker(trades);
    
    for (const [ticker, tickerTrades] of Object.entries(tradesByTicker)) {
      if (tickerTrades.length < 5) continue;
      
      // Calculate average entry price
      const avgEntryPrice = tickerTrades.reduce((sum, trade) => sum + trade.entryPrice, 0) / tickerTrades.length;
      
      // Find trades that deviate significantly from the mean
      const overboughtTrades = tickerTrades.filter(trade => trade.entryPrice > avgEntryPrice * 1.1);
      const oversoldTrades = tickerTrades.filter(trade => trade.entryPrice < avgEntryPrice * 0.9);

      // Analyze overbought pattern (selling high)
      if (overboughtTrades.length >= 2) {
        const overboughtPattern = this.analyzeMeanReversionPattern(overboughtTrades, 'Overbought', avgEntryPrice);
        if (overboughtPattern) patterns.push(overboughtPattern);
      }

      // Analyze oversold pattern (buying low)
      if (oversoldTrades.length >= 2) {
        const oversoldPattern = this.analyzeMeanReversionPattern(oversoldTrades, 'Oversold', avgEntryPrice);
        if (oversoldPattern) patterns.push(oversoldPattern);
      }
    }

    return patterns;
  }

  /**
   * Analyze mean reversion pattern
   */
  private analyzeMeanReversionPattern(
    trades: TradeWithCalculations[], 
    patternType: string, 
    avgPrice: number
  ): TradingPattern | null {
    let winningTrades = 0;
    let totalReturn = 0;

    trades.forEach(trade => {
      if (trade.profitLoss && trade.profitLoss > 0) {
        winningTrades++;
      }
      if (trade.profitLoss) {
        totalReturn += trade.profitLoss;
      }
    });

    const winRate = winningTrades / trades.length;
    const avgReturn = totalReturn / trades.length;
    const avgDeviation = trades.reduce((sum, trade) => 
      sum + Math.abs(trade.entryPrice - avgPrice) / avgPrice, 0
    ) / trades.length;

    const confidence = Math.min(avgDeviation * 2, 1); // Higher deviation = higher confidence

    if (winRate >= 0.6 && confidence >= 0.5) {
      return {
        id: `mean_reversion_${patternType.toLowerCase()}_${trades[0].ticker}_${Date.now()}`,
        type: 'mean_reversion',
        name: `${patternType} Mean Reversion`,
        confidence,
        trades,
        description: `${patternType} pattern with ${(avgDeviation * 100).toFixed(1)}% average deviation and ${(winRate * 100).toFixed(1)}% win rate`,
        performance: {
          winRate,
          avgReturn,
          totalTrades: trades.length
        },
        metadata: {
          startDate: new Date(trades[0].entryDate).toISOString(),
          endDate: new Date(trades[trades.length - 1].entryDate).toISOString(),
          patternStrength: confidence,
          marketConditions: patternType === 'Overbought' ? 'High volatility' : 'Low volatility'
        }
      };
    }

    return null;
  }

  /**
   * Detect breakout patterns
   */
  private detectBreakoutPatterns(trades: TradeWithCalculations[]): TradingPattern[] {
    const patterns: TradingPattern[] = [];
    
    // Group trades by ticker
    const tradesByTicker = this.groupTradesByTicker(trades);
    
    for (const [ticker, tickerTrades] of Object.entries(tradesByTicker)) {
      if (tickerTrades.length < 5) continue;
      
      // Sort by entry date
      const sortedTrades = tickerTrades.sort((a, b) => 
        new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
      );

      // Detect resistance breakouts
      const resistanceBreakout = this.detectResistanceBreakout(sortedTrades);
      if (resistanceBreakout) patterns.push(resistanceBreakout);

      // Detect support breakouts
      const supportBreakout = this.detectSupportBreakout(sortedTrades);
      if (supportBreakout) patterns.push(supportBreakout);
    }

    return patterns;
  }

  /**
   * Detect resistance breakout pattern
   */
  private detectResistanceBreakout(trades: TradeWithCalculations[]): TradingPattern | null {
    if (trades.length < 5) return null;

    // Find resistance level (highest price before breakout)
    let resistanceLevel = 0;
    let breakoutTrades: TradeWithCalculations[] = [];
    let preBreakoutTrades: TradeWithCalculations[] = [];

    for (let i = 0; i < trades.length - 1; i++) {
      const currentTrade = trades[i];
      const nextTrade = trades[i + 1];

      // Update resistance level
      if (currentTrade.entryPrice > resistanceLevel) {
        resistanceLevel = currentTrade.entryPrice;
      }

      // Check for breakout
      if (nextTrade.entryPrice > resistanceLevel * 1.02) { // 2% above resistance
        breakoutTrades = trades.slice(i + 1);
        preBreakoutTrades = trades.slice(0, i + 1);
        break;
      }
    }

    if (breakoutTrades.length >= 2 && preBreakoutTrades.length >= 2) {
      return this.analyzeBreakoutPattern(breakoutTrades, 'Resistance Breakout', resistanceLevel);
    }

    return null;
  }

  /**
   * Detect support breakout pattern
   */
  private detectSupportBreakout(trades: TradeWithCalculations[]): TradingPattern | null {
    if (trades.length < 5) return null;

    // Find support level (lowest price before breakout)
    let supportLevel = Infinity;
    let breakoutTrades: TradeWithCalculations[] = [];
    let preBreakoutTrades: TradeWithCalculations[] = [];

    for (let i = 0; i < trades.length - 1; i++) {
      const currentTrade = trades[i];
      const nextTrade = trades[i + 1];

      // Update support level
      if (currentTrade.entryPrice < supportLevel) {
        supportLevel = currentTrade.entryPrice;
      }

      // Check for breakout
      if (nextTrade.entryPrice < supportLevel * 0.98) { // 2% below support
        breakoutTrades = trades.slice(i + 1);
        preBreakoutTrades = trades.slice(0, i + 1);
        break;
      }
    }

    if (breakoutTrades.length >= 2 && preBreakoutTrades.length >= 2) {
      return this.analyzeBreakoutPattern(breakoutTrades, 'Support Breakout', supportLevel);
    }

    return null;
  }

  /**
   * Analyze breakout pattern
   */
  private analyzeBreakoutPattern(
    trades: TradeWithCalculations[], 
    patternType: string, 
    breakoutLevel: number
  ): TradingPattern | null {
    let winningTrades = 0;
    let totalReturn = 0;

    trades.forEach(trade => {
      if (trade.profitLoss && trade.profitLoss > 0) {
        winningTrades++;
      }
      if (trade.profitLoss) {
        totalReturn += trade.profitLoss;
      }
    });

    const winRate = winningTrades / trades.length;
    const avgReturn = totalReturn / trades.length;
    const avgBreakoutStrength = trades.reduce((sum, trade) => 
      sum + Math.abs(trade.entryPrice - breakoutLevel) / breakoutLevel, 0
    ) / trades.length;

    const confidence = Math.min(avgBreakoutStrength * 3, 1); // Higher breakout strength = higher confidence

    if (winRate >= 0.5 && confidence >= 0.4) {
      return {
        id: `breakout_${patternType.toLowerCase().replace(' ', '_')}_${trades[0].ticker}_${Date.now()}`,
        type: 'breakout',
        name: patternType,
        confidence,
        trades,
        description: `${patternType} with ${(avgBreakoutStrength * 100).toFixed(1)}% average breakout strength and ${(winRate * 100).toFixed(1)}% win rate`,
        performance: {
          winRate,
          avgReturn,
          totalTrades: trades.length
        },
        metadata: {
          startDate: new Date(trades[0].entryDate).toISOString(),
          endDate: new Date(trades[trades.length - 1].entryDate).toISOString(),
          patternStrength: confidence,
          marketConditions: 'Breakout momentum'
        }
      };
    }

    return null;
  }

  /**
   * Detect volume patterns
   */
  private detectVolumePatterns(trades: TradeWithCalculations[]): TradingPattern[] {
    const patterns: TradingPattern[] = [];
    
    // Group trades by ticker
    const tradesByTicker = this.groupTradesByTicker(trades);
    
    for (const [ticker, tickerTrades] of Object.entries(tradesByTicker)) {
      if (tickerTrades.length < 5) continue;
      
      // Calculate average position size
      const avgPositionSize = tickerTrades.reduce((sum, trade) => 
        sum + (trade.entryPrice * trade.quantity), 0
      ) / tickerTrades.length;

      // Find high volume trades (2x average)
      const highVolumeTrades = tickerTrades.filter(trade => 
        (trade.entryPrice * trade.quantity) > avgPositionSize * 2
      );

      if (highVolumeTrades.length >= 2) {
        const volumePattern = this.analyzeVolumePattern(highVolumeTrades, avgPositionSize);
        if (volumePattern) patterns.push(volumePattern);
      }
    }

    return patterns;
  }

  /**
   * Analyze volume pattern
   */
  private analyzeVolumePattern(trades: TradeWithCalculations[], avgPositionSize: number): TradingPattern | null {
    let winningTrades = 0;
    let totalReturn = 0;

    trades.forEach(trade => {
      if (trade.profitLoss && trade.profitLoss > 0) {
        winningTrades++;
      }
      if (trade.profitLoss) {
        totalReturn += trade.profitLoss;
      }
    });

    const winRate = winningTrades / trades.length;
    const avgReturn = totalReturn / trades.length;
    const avgVolumeRatio = trades.reduce((sum, trade) => 
      sum + (trade.entryPrice * trade.quantity) / avgPositionSize, 0
    ) / trades.length;

    const confidence = Math.min((avgVolumeRatio - 1) * 0.5, 1); // Higher volume ratio = higher confidence

    if (winRate >= 0.5 && confidence >= 0.3) {
      return {
        id: `volume_high_${trades[0].ticker}_${Date.now()}`,
        type: 'volume',
        name: 'High Volume Pattern',
        confidence,
        trades,
        description: `High volume pattern with ${avgVolumeRatio.toFixed(1)}x average position size and ${(winRate * 100).toFixed(1)}% win rate`,
        performance: {
          winRate,
          avgReturn,
          totalTrades: trades.length
        },
        metadata: {
          startDate: new Date(trades[0].entryDate).toISOString(),
          endDate: new Date(trades[trades.length - 1].entryDate).toISOString(),
          patternStrength: confidence,
          marketConditions: 'High conviction trades'
        }
      };
    }

    return null;
  }

  /**
   * Group trades by ticker
   */
  private groupTradesByTicker(trades: TradeWithCalculations[]): Record<string, TradeWithCalculations[]> {
    return trades.reduce((groups, trade) => {
      const ticker = trade.ticker;
      if (!groups[ticker]) {
        groups[ticker] = [];
      }
      groups[ticker].push(trade);
      return groups;
    }, {} as Record<string, TradeWithCalculations[]>);
  }

  /**
   * Generate pattern summary
   */
  private generatePatternSummary(patterns: TradingPattern[]): PatternDetectionResult['summary'] {
    if (patterns.length === 0) {
      return {
        totalPatterns: 0,
        mostProfitablePattern: 'None',
        averageConfidence: 0,
        patternDistribution: {}
      };
    }

    // Calculate pattern distribution
    const distribution: Record<string, number> = {};
    patterns.forEach(pattern => {
      distribution[pattern.type] = (distribution[pattern.type] || 0) + 1;
    });

    // Find most profitable pattern
    const mostProfitable = patterns.reduce((best, current) => 
      current.performance.avgReturn > best.performance.avgReturn ? current : best
    );

    // Calculate average confidence
    const avgConfidence = patterns.reduce((sum, pattern) => sum + pattern.confidence, 0) / patterns.length;

    return {
      totalPatterns: patterns.length,
      mostProfitablePattern: mostProfitable.name,
      averageConfidence: avgConfidence,
      patternDistribution: distribution
    };
  }

  /**
   * Get pattern recommendations based on detected patterns
   */
  async getPatternRecommendations(patterns: TradingPattern[]): Promise<string[]> {
    const recommendations: string[] = [];

    if (patterns.length === 0) {
      recommendations.push("No clear patterns detected. Consider diversifying your trading strategies.");
      return recommendations;
    }

    // Analyze pattern performance
    const profitablePatterns = patterns.filter(p => p.performance.avgReturn > 0);
    const unprofitablePatterns = patterns.filter(p => p.performance.avgReturn <= 0);

    if (profitablePatterns.length > 0) {
      const bestPattern = profitablePatterns.reduce((best, current) => 
        current.performance.avgReturn > best.performance.avgReturn ? current : best
      );
      recommendations.push(
        `Focus on ${bestPattern.name} - your most profitable pattern with ${(bestPattern.performance.avgReturn).toFixed(2)}% average return.`
      );
    }

    if (unprofitablePatterns.length > 0) {
      const worstPattern = unprofitablePatterns.reduce((worst, current) => 
        current.performance.avgReturn < worst.performance.avgReturn ? current : worst
      );
      recommendations.push(
        `Avoid ${worstPattern.name} - this pattern has been unprofitable with ${(worstPattern.performance.avgReturn).toFixed(2)}% average return.`
      );
    }

    // Volume analysis
    const volumePatterns = patterns.filter(p => p.type === 'volume');
    if (volumePatterns.length > 0) {
      const avgVolumeWinRate = volumePatterns.reduce((sum, p) => sum + p.performance.winRate, 0) / volumePatterns.length;
      if (avgVolumeWinRate > 0.6) {
        recommendations.push("Your high-volume trades are performing well. Consider increasing position sizes for high-conviction setups.");
      } else {
        recommendations.push("Your high-volume trades are underperforming. Consider reducing position sizes or improving entry timing.");
      }
    }

    // Trend analysis
    const trendPatterns = patterns.filter(p => p.type === 'trend_following');
    if (trendPatterns.length > 0) {
      const avgTrendWinRate = trendPatterns.reduce((sum, p) => sum + p.performance.winRate, 0) / trendPatterns.length;
      if (avgTrendWinRate > 0.6) {
        recommendations.push("You're good at trend following. Consider adding more trend-based strategies to your portfolio.");
      } else {
        recommendations.push("Your trend following needs improvement. Consider using tighter stop losses or better entry timing.");
      }
    }

    return recommendations;
  }
} 