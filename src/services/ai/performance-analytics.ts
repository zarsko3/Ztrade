import { TradeWithCalculations } from '@/types/trade';

export interface AdvancedPerformanceMetrics {
  // Basic Metrics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnL: number;
  totalPnLPercentage: number;
  winRate: number;
  averageReturn: number;
  averageWin: number;
  averageLoss: number;
  
  // Risk-Adjusted Returns
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  informationRatio: number;
  maxDrawdown: number;
  maxDrawdownPercentage: number;
  volatility: number;
  downsideDeviation: number;
  
  // Factor Analysis
  factorAnalysis: {
    marketTiming: number;
    stockSelection: number;
    sectorAllocation: number;
    sizeFactor: number;
    momentumFactor: number;
  };
  
  // Rolling Performance
  rollingPerformance: {
    periods: RollingPeriod[];
    bestPeriod: RollingPeriod;
    worstPeriod: RollingPeriod;
  };
  
  // Behavioral Metrics
  behavioralMetrics: {
    averageHoldingPeriod: number;
    tradeFrequency: number;
    positionSizingConsistency: number;
    riskTolerance: number;
    emotionalControl: number;
  };
  
  // Benchmark Comparison
  benchmarkComparison: {
    benchmarkReturn: number;
    excessReturn: number;
    trackingError: number;
    informationRatio: number;
    beta: number;
    alpha: number;
  };
}

export interface RollingPeriod {
  startDate: string;
  endDate: string;
  return: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  tradeCount: number;
}

export interface PerformanceInsight {
  type: 'performance' | 'risk' | 'behavioral' | 'factor';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  recommendation?: string;
  metrics: Record<string, number>;
}

export class AdvancedPerformanceAnalytics {
  private riskFreeRate = 0.02; // 2% annual risk-free rate
  private benchmarkReturn = 0.10; // 10% annual benchmark return

  /**
   * Calculate comprehensive performance metrics
   */
  async calculateAdvancedMetrics(trades: TradeWithCalculations[]): Promise<AdvancedPerformanceMetrics> {
    const closedTrades = trades.filter(trade => !trade.isOpen && trade.profitLoss !== undefined);
    
    if (closedTrades.length === 0) {
      return this.getEmptyMetrics();
    }

    // Basic metrics
    const basicMetrics = this.calculateBasicMetrics(closedTrades);
    
    // Risk-adjusted returns
    const riskMetrics = this.calculateRiskAdjustedReturns(closedTrades);
    
    // Factor analysis
    const factorAnalysis = this.calculateFactorAnalysis(closedTrades);
    
    // Rolling performance
    const rollingPerformance = this.calculateRollingPerformance(closedTrades);
    
    // Behavioral metrics
    const behavioralMetrics = this.calculateBehavioralMetrics(closedTrades);
    
    // Benchmark comparison
    const benchmarkComparison = this.calculateBenchmarkComparison(closedTrades);

    return {
      ...basicMetrics,
      ...riskMetrics,
      factorAnalysis,
      rollingPerformance,
      behavioralMetrics,
      benchmarkComparison
    };
  }

  /**
   * Calculate basic performance metrics
   */
  private calculateBasicMetrics(trades: TradeWithCalculations[]) {
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.profitLoss! > 0).length;
    const losingTrades = trades.filter(t => t.profitLoss! < 0).length;
    
    const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss!, 0);
    const totalPnLPercentage = trades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0);
    
    const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
    const averageReturn = totalTrades > 0 ? totalPnLPercentage / totalTrades : 0;
    
    const winningTradesList = trades.filter(t => t.profitLoss! > 0);
    const losingTradesList = trades.filter(t => t.profitLoss! < 0);
    
    const averageWin = winningTradesList.length > 0 
      ? winningTradesList.reduce((sum, t) => sum + t.profitLoss!, 0) / winningTradesList.length 
      : 0;
    
    const averageLoss = losingTradesList.length > 0 
      ? losingTradesList.reduce((sum, t) => sum + t.profitLoss!, 0) / losingTradesList.length 
      : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      totalPnL,
      totalPnLPercentage,
      winRate,
      averageReturn,
      averageWin,
      averageLoss
    };
  }

  /**
   * Calculate risk-adjusted return metrics
   */
  private calculateRiskAdjustedReturns(trades: TradeWithCalculations[]) {
    const returns = trades.map(t => t.profitLossPercentage || 0);
    const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    
    // Calculate volatility (standard deviation)
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - averageReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    // Calculate downside deviation
    const downsideReturns = returns.filter(r => r < averageReturn);
    const downsideVariance = downsideReturns.length > 0 
      ? downsideReturns.reduce((sum, r) => sum + Math.pow(r - averageReturn, 2), 0) / downsideReturns.length 
      : 0;
    const downsideDeviation = Math.sqrt(downsideVariance);
    
    // Calculate maximum drawdown
    const maxDrawdown = this.calculateMaxDrawdown(returns);
    const maxDrawdownPercentage = maxDrawdown / 100;
    
    // Risk-adjusted ratios
    const sharpeRatio = volatility > 0 ? (averageReturn - this.riskFreeRate) / volatility : 0;
    const sortinoRatio = downsideDeviation > 0 ? (averageReturn - this.riskFreeRate) / downsideDeviation : 0;
    const calmarRatio = maxDrawdownPercentage > 0 ? averageReturn / maxDrawdownPercentage : 0;
    const informationRatio = volatility > 0 ? (averageReturn - this.benchmarkReturn) / volatility : 0;

    return {
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      informationRatio,
      maxDrawdown,
      maxDrawdownPercentage,
      volatility,
      downsideDeviation
    };
  }

  /**
   * Calculate maximum drawdown
   */
  private calculateMaxDrawdown(returns: number[]): number {
    let peak = 0;
    let maxDrawdown = 0;
    let cumulativeReturn = 0;

    for (const return_ of returns) {
      cumulativeReturn += return_;
      if (cumulativeReturn > peak) {
        peak = cumulativeReturn;
      }
      const drawdown = peak - cumulativeReturn;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  /**
   * Calculate factor analysis
   */
  private calculateFactorAnalysis(trades: TradeWithCalculations[]) {
    // Market timing factor (correlation with market movements)
    const marketTiming = this.calculateMarketTimingFactor(trades);
    
    // Stock selection factor (excess return vs sector average)
    const stockSelection = this.calculateStockSelectionFactor(trades);
    
    // Sector allocation factor
    const sectorAllocation = this.calculateSectorAllocationFactor(trades);
    
    // Size factor (small cap vs large cap performance)
    const sizeFactor = this.calculateSizeFactor(trades);
    
    // Momentum factor (trend following vs mean reversion)
    const momentumFactor = this.calculateMomentumFactor(trades);

    return {
      marketTiming,
      stockSelection,
      sectorAllocation,
      sizeFactor,
      momentumFactor
    };
  }

  /**
   * Calculate market timing factor
   */
  private calculateMarketTimingFactor(trades: TradeWithCalculations[]): number {
    // Simplified market timing calculation
    // In a real implementation, this would compare trade timing with market movements
    const longTrades = trades.filter(t => !t.isShort);
    const shortTrades = trades.filter(t => t.isShort);
    
    const longPerformance = longTrades.length > 0 
      ? longTrades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / longTrades.length 
      : 0;
    
    const shortPerformance = shortTrades.length > 0 
      ? shortTrades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / shortTrades.length 
      : 0;
    
    // Market timing score based on long vs short performance
    return (longPerformance - shortPerformance) / 100;
  }

  /**
   * Calculate stock selection factor
   */
  private calculateStockSelectionFactor(trades: TradeWithCalculations[]): number {
    // Simplified stock selection calculation
    // In a real implementation, this would compare against sector/industry averages
    const averageReturn = trades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / trades.length;
    const benchmarkReturn = 5; // Assume 5% benchmark return
    
    return (averageReturn - benchmarkReturn) / 100;
  }

  /**
   * Calculate sector allocation factor
   */
  private calculateSectorAllocationFactor(trades: TradeWithCalculations[]): number {
    // Simplified sector allocation calculation
    // In a real implementation, this would analyze sector weightings vs benchmark
    const techTrades = trades.filter(t => ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'NVDA'].includes(t.ticker));
    const techPerformance = techTrades.length > 0 
      ? techTrades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / techTrades.length 
      : 0;
    
    const nonTechPerformance = trades.length > techTrades.length 
      ? trades.filter(t => !['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'NVDA'].includes(t.ticker))
          .reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / (trades.length - techTrades.length)
      : 0;
    
    return (techPerformance - nonTechPerformance) / 100;
  }

  /**
   * Calculate size factor
   */
  private calculateSizeFactor(trades: TradeWithCalculations[]): number {
    // Simplified size factor calculation
    // In a real implementation, this would compare small cap vs large cap performance
    const largeCapTrades = trades.filter(t => ['AAPL', 'GOOGL', 'MSFT', 'AMZN'].includes(t.ticker));
    const smallCapTrades = trades.filter(t => !['AAPL', 'GOOGL', 'MSFT', 'AMZN'].includes(t.ticker));
    
    const largeCapPerformance = largeCapTrades.length > 0 
      ? largeCapTrades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / largeCapTrades.length 
      : 0;
    
    const smallCapPerformance = smallCapTrades.length > 0 
      ? smallCapTrades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / smallCapTrades.length 
      : 0;
    
    return (smallCapPerformance - largeCapPerformance) / 100;
  }

  /**
   * Calculate momentum factor
   */
  private calculateMomentumFactor(trades: TradeWithCalculations[]): number {
    // Simplified momentum factor calculation
    // In a real implementation, this would analyze trend following vs mean reversion
    const holdingPeriods = trades.map(t => t.holdingPeriod || 0);
    const averageHoldingPeriod = holdingPeriods.reduce((sum, h) => sum + h, 0) / holdingPeriods.length;
    
    // Momentum score based on holding period (shorter = more momentum)
    return Math.max(0, 1 - (averageHoldingPeriod / 30)); // Normalize to 0-1
  }

  /**
   * Calculate rolling performance
   */
  private calculateRollingPerformance(trades: TradeWithCalculations[]): { periods: RollingPeriod[], bestPeriod: RollingPeriod, worstPeriod: RollingPeriod } {
    const sortedTrades = trades.sort((a, b) => 
      new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );

    const periods: RollingPeriod[] = [];
    const windowSize = Math.min(10, Math.floor(trades.length / 3)); // Rolling window of 10 trades or 1/3 of total

    for (let i = 0; i <= trades.length - windowSize; i++) {
      const windowTrades = sortedTrades.slice(i, i + windowSize);
      const returns = windowTrades.map(t => t.profitLossPercentage || 0);
      const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      
      // Calculate volatility for this window
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - averageReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance);
      
      // Calculate Sharpe ratio for this window
      const sharpeRatio = volatility > 0 ? (averageReturn - this.riskFreeRate) / volatility : 0;
      
      // Calculate max drawdown for this window
      const maxDrawdown = this.calculateMaxDrawdown(returns);

      periods.push({
        startDate: new Date(windowTrades[0].entryDate).toISOString(),
        endDate: new Date(windowTrades[windowTrades.length - 1].entryDate).toISOString(),
        return: averageReturn,
        volatility,
        sharpeRatio,
        maxDrawdown,
        tradeCount: windowTrades.length
      });
    }

    const bestPeriod = periods.reduce((best, current) => 
      current.return > best.return ? current : best
    );
    
    const worstPeriod = periods.reduce((worst, current) => 
      current.return < worst.return ? current : worst
    );

    return { periods, bestPeriod, worstPeriod };
  }

  /**
   * Calculate behavioral metrics
   */
  private calculateBehavioralMetrics(trades: TradeWithCalculations[]) {
    // Average holding period
    const holdingPeriods = trades.map(t => t.holdingPeriod || 0);
    const averageHoldingPeriod = holdingPeriods.reduce((sum, h) => sum + h, 0) / holdingPeriods.length;
    
    // Trade frequency (trades per month)
    const firstTrade = trades[0];
    const lastTrade = trades[trades.length - 1];
    const totalDays = (new Date(lastTrade.entryDate).getTime() - new Date(firstTrade.entryDate).getTime()) / (1000 * 60 * 60 * 24);
    const tradeFrequency = totalDays > 0 ? trades.length / (totalDays / 30) : 0;
    
    // Position sizing consistency
    const positionSizes = trades.map(t => (t.entryPrice * t.quantity));
    const averagePositionSize = positionSizes.reduce((sum, size) => sum + size, 0) / positionSizes.length;
    const positionSizeVariance = positionSizes.reduce((sum, size) => sum + Math.pow(size - averagePositionSize, 2), 0) / positionSizes.length;
    const positionSizingConsistency = averagePositionSize > 0 ? 1 - (Math.sqrt(positionSizeVariance) / averagePositionSize) : 0;
    
    // Risk tolerance (based on average loss size vs win size)
    const winningTrades = trades.filter(t => t.profitLoss! > 0);
    const losingTrades = trades.filter(t => t.profitLoss! < 0);
    
    const averageWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + Math.abs(t.profitLoss!), 0) / winningTrades.length 
      : 0;
    
    const averageLoss = losingTrades.length > 0 
      ? losingTrades.reduce((sum, t) => sum + Math.abs(t.profitLoss!), 0) / losingTrades.length 
      : 0;
    
    const riskTolerance = averageWin > 0 ? averageLoss / averageWin : 0;
    
    // Emotional control (consistency in performance)
    const returns = trades.map(t => t.profitLossPercentage || 0);
    const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const returnVariance = returns.reduce((sum, r) => sum + Math.pow(r - averageReturn, 2), 0) / returns.length;
    const emotionalControl = 1 - Math.min(1, Math.sqrt(returnVariance) / Math.abs(averageReturn));

    return {
      averageHoldingPeriod,
      tradeFrequency,
      positionSizingConsistency: Math.max(0, positionSizingConsistency),
      riskTolerance: Math.min(1, riskTolerance),
      emotionalControl: Math.max(0, emotionalControl)
    };
  }

  /**
   * Calculate benchmark comparison
   */
  private calculateBenchmarkComparison(trades: TradeWithCalculations[]) {
    const portfolioReturn = trades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / trades.length;
    const benchmarkReturn = this.benchmarkReturn;
    const excessReturn = portfolioReturn - benchmarkReturn;
    
    // Calculate tracking error
    const returns = trades.map(t => t.profitLossPercentage || 0);
    const trackingError = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - benchmarkReturn, 2), 0) / returns.length);
    
    // Information ratio
    const informationRatio = trackingError > 0 ? excessReturn / trackingError : 0;
    
    // Beta calculation (simplified)
    const beta = this.calculateBeta(trades);
    
    // Alpha calculation
    const alpha = excessReturn - (beta * (benchmarkReturn - this.riskFreeRate));

    return {
      benchmarkReturn,
      excessReturn,
      trackingError,
      informationRatio,
      beta,
      alpha
    };
  }

  /**
   * Calculate beta (simplified)
   */
  private calculateBeta(trades: TradeWithCalculations[]): number {
    // Simplified beta calculation
    // In a real implementation, this would use market data
    const returns = trades.map(t => t.profitLossPercentage || 0);
    const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    
    // Assume market volatility is 15% annually
    const marketVolatility = 15;
    const portfolioVolatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - averageReturn, 2), 0) / returns.length);
    
    // Simplified correlation assumption
    const correlation = 0.7;
    
    return correlation * (portfolioVolatility / marketVolatility);
  }

  /**
   * Generate performance insights
   */
  async generatePerformanceInsights(metrics: AdvancedPerformanceMetrics): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = [];

    // Performance insights
    if (metrics.winRate > 0.6) {
      insights.push({
        type: 'performance',
        title: 'Strong Win Rate',
        description: `Your win rate of ${(metrics.winRate * 100).toFixed(1)}% is above average, indicating good trade selection.`,
        impact: 'positive',
        confidence: 0.8,
        recommendation: 'Continue focusing on high-probability setups and maintain your current selection criteria.',
        metrics: { winRate: metrics.winRate }
      });
    } else if (metrics.winRate < 0.4) {
      insights.push({
        type: 'performance',
        title: 'Low Win Rate',
        description: `Your win rate of ${(metrics.winRate * 100).toFixed(1)}% suggests room for improvement in trade selection.`,
        impact: 'negative',
        confidence: 0.7,
        recommendation: 'Review your entry criteria and consider tightening your selection process.',
        metrics: { winRate: metrics.winRate }
      });
    }

    // Risk insights
    if (metrics.sharpeRatio > 1.0) {
      insights.push({
        type: 'risk',
        title: 'Excellent Risk-Adjusted Returns',
        description: `Your Sharpe ratio of ${metrics.sharpeRatio.toFixed(2)} indicates excellent risk-adjusted performance.`,
        impact: 'positive',
        confidence: 0.9,
        recommendation: 'Your risk management is working well. Consider scaling up position sizes gradually.',
        metrics: { sharpeRatio: metrics.sharpeRatio }
      });
    } else if (metrics.sharpeRatio < 0.5) {
      insights.push({
        type: 'risk',
        title: 'Poor Risk-Adjusted Returns',
        description: `Your Sharpe ratio of ${metrics.sharpeRatio.toFixed(2)} suggests poor risk-adjusted performance.`,
        impact: 'negative',
        confidence: 0.8,
        recommendation: 'Focus on improving risk management and reducing position sizes during volatile periods.',
        metrics: { sharpeRatio: metrics.sharpeRatio }
      });
    }

    // Behavioral insights
    if (metrics.behavioralMetrics.emotionalControl > 0.7) {
      insights.push({
        type: 'behavioral',
        title: 'Good Emotional Control',
        description: 'Your trading shows consistent emotional control with low performance variance.',
        impact: 'positive',
        confidence: 0.8,
        recommendation: 'Maintain your disciplined approach and avoid emotional decision-making.',
        metrics: { emotionalControl: metrics.behavioralMetrics.emotionalControl }
      });
    } else if (metrics.behavioralMetrics.emotionalControl < 0.3) {
      insights.push({
        type: 'behavioral',
        title: 'Emotional Trading Detected',
        description: 'Your trading shows high variance, suggesting emotional decision-making.',
        impact: 'negative',
        confidence: 0.7,
        recommendation: 'Implement strict trading rules and consider using a trading journal to track emotions.',
        metrics: { emotionalControl: metrics.behavioralMetrics.emotionalControl }
      });
    }

    // Factor insights
    if (metrics.factorAnalysis.marketTiming > 0.1) {
      insights.push({
        type: 'factor',
        title: 'Strong Market Timing',
        description: 'Your market timing skills are contributing positively to performance.',
        impact: 'positive',
        confidence: 0.7,
        recommendation: 'Continue monitoring market conditions and timing your entries carefully.',
        metrics: { marketTiming: metrics.factorAnalysis.marketTiming }
      });
    }

    return insights;
  }

  /**
   * Get empty metrics for when no trades exist
   */
  private getEmptyMetrics(): AdvancedPerformanceMetrics {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalPnL: 0,
      totalPnLPercentage: 0,
      winRate: 0,
      averageReturn: 0,
      averageWin: 0,
      averageLoss: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      informationRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercentage: 0,
      volatility: 0,
      downsideDeviation: 0,
      factorAnalysis: {
        marketTiming: 0,
        stockSelection: 0,
        sectorAllocation: 0,
        sizeFactor: 0,
        momentumFactor: 0
      },
      rollingPerformance: {
        periods: [],
        bestPeriod: {
          startDate: '',
          endDate: '',
          return: 0,
          volatility: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          tradeCount: 0
        },
        worstPeriod: {
          startDate: '',
          endDate: '',
          return: 0,
          volatility: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          tradeCount: 0
        }
      },
      behavioralMetrics: {
        averageHoldingPeriod: 0,
        tradeFrequency: 0,
        positionSizingConsistency: 0,
        riskTolerance: 0,
        emotionalControl: 0
      },
      benchmarkComparison: {
        benchmarkReturn: 0,
        excessReturn: 0,
        trackingError: 0,
        informationRatio: 0,
        beta: 0,
        alpha: 0
      }
    };
  }
} 