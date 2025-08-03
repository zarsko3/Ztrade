# Blueprint: Task 1.3.3 - Implement Rule-Based Trade Analysis

## Overview
This blueprint outlines the implementation of rule-based trade analysis to replace the GPT-powered insights. The system will use statistical methods, pattern recognition algorithms, and predefined rules to analyze trading behavior and provide actionable insights.

## Prerequisites
- Completed Task 1.1.1 (Create Next.js 14 project with TypeScript and App Router)
- Completed Task 1.2.1 (Initialize Prisma with SQLite database)
- Completed Task 1.2.2 (Define database schema for Trade model)
- Completed Task 1.2.3 (Define database schema for Performance model)
- Completed Task 1.2.4 (Create initial database migration)
- Completed Task 1.2.5 (Set up seed data for testing)

## Step-by-Step Instructions

### 1. Create Trade Analysis Service

Create a service for rule-based trade analysis at `src/services/trade-analysis-service.ts`:

```typescript
// src/services/trade-analysis-service.ts

import { Trade } from '@prisma/client';

export interface TradeAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  patterns: string[];
  suggestions: string[];
  metrics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
}

export interface TradeInsight {
  type: 'performance' | 'pattern' | 'risk' | 'opportunity';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: string;
}

export class TradeAnalysisService {
  /**
   * Calculate basic trading metrics
   */
  static calculateMetrics(trades: Trade[]): TradeAnalysis['metrics'] {
    const totalTrades = trades.length;
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
      };
    }

    // Calculate profit/loss for each trade
    const tradeResults = trades.map(trade => {
      if (!trade.exitPrice || !trade.exitDate) return null;
      
      const profitLoss = trade.isShort
        ? (trade.entryPrice - trade.exitPrice) * trade.quantity
        : (trade.exitPrice - trade.entryPrice) * trade.quantity;
      
      const fees = trade.fees || 0;
      return profitLoss - fees;
    }).filter(result => result !== null) as number[];

    const winningTrades = tradeResults.filter(result => result > 0);
    const losingTrades = tradeResults.filter(result => result < 0);
    
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    const averageWin = winningTrades.length > 0 ? winningTrades.reduce((a, b) => a + b, 0) / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((a, b) => a + b, 0) / losingTrades.length) : 0;
    
    const profitFactor = averageLoss > 0 ? (averageWin * winningTrades.length) / (averageLoss * losingTrades.length) : 0;
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = 0;
    let runningTotal = 0;
    
    for (const result of tradeResults) {
      runningTotal += result;
      if (runningTotal > peak) {
        peak = runningTotal;
      }
      const drawdown = peak - runningTotal;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    // Calculate Sharpe ratio (simplified)
    const returns = tradeResults.map(result => result / 1000); // Assuming $1000 average position size
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
    const sharpeRatio = variance > 0 ? avgReturn / Math.sqrt(variance) : 0;

    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      averageWin,
      averageLoss,
      profitFactor,
      maxDrawdown,
      sharpeRatio,
    };
  }

  /**
   * Analyze trading patterns
   */
  static analyzePatterns(trades: Trade[]): string[] {
    const patterns: string[] = [];
    
    if (trades.length === 0) return patterns;

    // Analyze position sizing
    const quantities = trades.map(t => t.quantity);
    const avgQuantity = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    const maxQuantity = Math.max(...quantities);
    const minQuantity = Math.min(...quantities);
    
    if (maxQuantity / avgQuantity > 3) {
      patterns.push('Inconsistent position sizing - some positions are much larger than average');
    }
    
    if (minQuantity / avgQuantity < 0.3) {
      patterns.push('Very small positions detected - may indicate lack of confidence');
    }

    // Analyze holding periods
    const holdingPeriods = trades
      .filter(t => t.exitDate)
      .map(t => {
        const entry = new Date(t.entryDate);
        const exit = new Date(t.exitDate!);
        return Math.floor((exit.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
      });
    
    if (holdingPeriods.length > 0) {
      const avgHoldingPeriod = holdingPeriods.reduce((a, b) => a + b, 0) / holdingPeriods.length;
      const shortTrades = holdingPeriods.filter(days => days <= 1).length;
      const longTrades = holdingPeriods.filter(days => days >= 30).length;
      
      if (shortTrades / holdingPeriods.length > 0.7) {
        patterns.push('High frequency of day trading - consider longer-term positions');
      }
      
      if (longTrades / holdingPeriods.length > 0.5) {
        patterns.push('Long-term holding pattern - may miss short-term opportunities');
      }
    }

    // Analyze ticker concentration
    const tickerCounts: { [key: string]: number } = {};
    trades.forEach(trade => {
      tickerCounts[trade.ticker] = (tickerCounts[trade.ticker] || 0) + 1;
    });
    
    const mostTradedTicker = Object.entries(tickerCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (mostTradedTicker && mostTradedTicker[1] / trades.length > 0.3) {
      patterns.push(`High concentration in ${mostTradedTicker[0]} - consider diversification`);
    }

    // Analyze entry timing
    const entryDays = trades.map(t => new Date(t.entryDate).getDay());
    const dayCounts: { [key: number]: number } = {};
    entryDays.forEach(day => {
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    const mostActiveDay = Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (mostActiveDay && mostActiveDay[1] / trades.length > 0.4) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      patterns.push(`Trading concentrated on ${dayNames[parseInt(mostActiveDay[0])]} - may miss opportunities on other days`);
    }

    return patterns;
  }

  /**
   * Generate trading insights
   */
  static generateInsights(trades: Trade[]): TradeInsight[] {
    const insights: TradeInsight[] = [];
    const metrics = this.calculateMetrics(trades);
    
    if (trades.length === 0) {
      insights.push({
        type: 'performance',
        title: 'No Trading Data',
        description: 'Start recording your trades to get insights and analysis.',
        severity: 'low',
        actionable: false,
      });
      return insights;
    }

    // Win rate insights
    if (metrics.winRate < 40) {
      insights.push({
        type: 'performance',
        title: 'Low Win Rate',
        description: `Your win rate is ${metrics.winRate.toFixed(1)}%. Consider improving your entry criteria or risk management.`,
        severity: 'high',
        actionable: true,
        action: 'Review your entry signals and consider tighter stop losses',
      });
    } else if (metrics.winRate > 70) {
      insights.push({
        type: 'performance',
        title: 'Excellent Win Rate',
        description: `Your win rate of ${metrics.winRate.toFixed(1)}% is very good. Focus on maximizing your winning trades.`,
        severity: 'low',
        actionable: true,
        action: 'Consider letting winners run longer and scaling out of positions',
      });
    }

    // Profit factor insights
    if (metrics.profitFactor < 1.5) {
      insights.push({
        type: 'performance',
        title: 'Low Profit Factor',
        description: `Your profit factor is ${metrics.profitFactor.toFixed(2)}. Aim for at least 1.5 for consistent profitability.`,
        severity: 'medium',
        actionable: true,
        action: 'Work on improving your risk-reward ratio and cutting losses quickly',
      });
    } else if (metrics.profitFactor > 3) {
      insights.push({
        type: 'performance',
        title: 'Strong Profit Factor',
        description: `Your profit factor of ${metrics.profitFactor.toFixed(2)} is excellent. Your winning trades significantly outweigh your losses.`,
        severity: 'low',
        actionable: false,
      });
    }

    // Drawdown insights
    if (metrics.maxDrawdown > 1000) {
      insights.push({
        type: 'risk',
        title: 'High Maximum Drawdown',
        description: `Your maximum drawdown is $${metrics.maxDrawdown.toFixed(2)}. Consider reducing position sizes or improving risk management.`,
        severity: 'high',
        actionable: true,
        action: 'Reduce position sizes and implement stricter stop losses',
      });
    }

    // Sharpe ratio insights
    if (metrics.sharpeRatio < 1) {
      insights.push({
        type: 'performance',
        title: 'Low Risk-Adjusted Returns',
        description: `Your Sharpe ratio of ${metrics.sharpeRatio.toFixed(2)} indicates low risk-adjusted returns. Consider improving your strategy.`,
        severity: 'medium',
        actionable: true,
        action: 'Focus on consistency and reducing volatility in your returns',
      });
    }

    // Pattern-based insights
    const patterns = this.analyzePatterns(trades);
    patterns.forEach(pattern => {
      insights.push({
        type: 'pattern',
        title: 'Trading Pattern Detected',
        description: pattern,
        severity: 'medium',
        actionable: true,
        action: 'Review your trading behavior and consider adjustments',
      });
    });

    return insights;
  }

  /**
   * Generate strategy suggestions
   */
  static generateStrategySuggestions(trades: Trade[]): string[] {
    const suggestions: string[] = [];
    const metrics = this.calculateMetrics(trades);
    
    if (trades.length === 0) {
      suggestions.push('Start with paper trading to develop your strategy');
      suggestions.push('Focus on one or two stocks initially to build consistency');
      suggestions.push('Keep detailed records of your trades and reasoning');
      return suggestions;
    }

    // Win rate based suggestions
    if (metrics.winRate < 50) {
      suggestions.push('Improve your entry criteria - wait for stronger signals');
      suggestions.push('Consider using technical indicators for better timing');
      suggestions.push('Review your losing trades to identify common patterns');
    }

    // Profit factor based suggestions
    if (metrics.profitFactor < 2) {
      suggestions.push('Work on your risk-reward ratio - aim for 2:1 or better');
      suggestions.push('Let your winners run longer before taking profits');
      suggestions.push('Cut your losses more quickly - don\'t let small losses become big ones');
    }

    // Position sizing suggestions
    const avgQuantity = trades.reduce((sum, t) => sum + t.quantity, 0) / trades.length;
    const maxQuantity = Math.max(...trades.map(t => t.quantity));
    
    if (maxQuantity / avgQuantity > 2) {
      suggestions.push('Standardize your position sizes for more consistent results');
      suggestions.push('Consider using a fixed percentage of your capital per trade');
    }

    // Diversification suggestions
    const tickerCounts: { [key: string]: number } = {};
    trades.forEach(trade => {
      tickerCounts[trade.ticker] = (tickerCounts[trade.ticker] || 0) + 1;
    });
    
    const uniqueTickers = Object.keys(tickerCounts).length;
    if (uniqueTickers < 5 && trades.length > 10) {
      suggestions.push('Consider diversifying across more stocks to reduce risk');
      suggestions.push('Look for opportunities in different sectors');
    }

    // Time-based suggestions
    const recentTrades = trades
      .filter(t => new Date(t.entryDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .length;
    
    if (recentTrades === 0) {
      suggestions.push('You haven\'t traded recently - consider reviewing market conditions');
      suggestions.push('Set aside time each day to review potential opportunities');
    }

    return suggestions;
  }

  /**
   * Generate comprehensive trade analysis
   */
  static generateTradeAnalysis(trades: Trade[]): TradeAnalysis {
    const metrics = this.calculateMetrics(trades);
    const patterns = this.analyzePatterns(trades);
    const insights = this.generateInsights(trades);
    const suggestions = this.generateStrategySuggestions(trades);

    // Generate summary
    let summary = '';
    if (trades.length === 0) {
      summary = 'No trading data available. Start recording your trades to get insights.';
    } else {
      summary = `Analyzed ${trades.length} trades with a ${metrics.winRate.toFixed(1)}% win rate. `;
      if (metrics.profitFactor > 1.5) {
        summary += 'Your profit factor indicates good risk management. ';
      } else {
        summary += 'Consider improving your risk-reward ratio. ';
      }
      if (patterns.length > 0) {
        summary += `Found ${patterns.length} trading patterns that could be optimized.`;
      }
    }

    // Generate strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (metrics.winRate > 60) {
      strengths.push(`Strong win rate of ${metrics.winRate.toFixed(1)}%`);
    }
    if (metrics.profitFactor > 2) {
      strengths.push(`Excellent profit factor of ${metrics.profitFactor.toFixed(2)}`);
    }
    if (metrics.maxDrawdown < 500) {
      strengths.push('Good risk management with low maximum drawdown');
    }

    if (metrics.winRate < 50) {
      weaknesses.push(`Low win rate of ${metrics.winRate.toFixed(1)}%`);
    }
    if (metrics.profitFactor < 1.5) {
      weaknesses.push(`Poor profit factor of ${metrics.profitFactor.toFixed(2)}`);
    }
    if (metrics.maxDrawdown > 1000) {
      weaknesses.push('High maximum drawdown indicates poor risk management');
    }

    return {
      summary,
      strengths,
      weaknesses,
      patterns,
      suggestions,
      metrics,
    };
  }
}
```

### 2. Create API Endpoints

Create API endpoints for the trade analysis at `src/app/api/analysis/route.ts`:

```typescript
// src/app/api/analysis/route.ts

import { TradeAnalysisService } from '@/services/trade-analysis-service';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timeframe = 'all', ticker } = body;

    // Build query based on timeframe
    let whereClause: any = {};
    
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (timeframe) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      whereClause.entryDate = {
        gte: startDate,
      };
    }

    if (ticker) {
      whereClause.ticker = ticker;
    }

    // Fetch trades from database
    const trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: { entryDate: 'desc' },
    });

    // Generate analysis
    const analysis = TradeAnalysisService.generateTradeAnalysis(trades);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error generating trade analysis:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate trade analysis',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
```

### 3. Create Test API Endpoint

Create a test endpoint at `src/app/api/analysis/test/route.ts`:

```typescript
// src/app/api/analysis/test/route.ts

import { TradeAnalysisService } from '@/services/trade-analysis-service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Sample trade data for testing
    const sampleTrades = [
      {
        id: 1,
        ticker: 'AAPL',
        entryDate: new Date('2023-01-15'),
        entryPrice: 135.83,
        exitDate: new Date('2023-02-10'),
        exitPrice: 151.73,
        quantity: 10,
        fees: 9.99,
        notes: 'Bought after earnings dip, sold after recovery',
        tags: 'earnings,tech,long-term',
        isShort: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        performanceId: null,
      },
      {
        id: 2,
        ticker: 'MSFT',
        entryDate: new Date('2023-02-01'),
        entryPrice: 247.81,
        exitDate: new Date('2023-03-15'),
        exitPrice: 265.44,
        quantity: 5,
        fees: 9.99,
        notes: 'Technical breakout play',
        tags: 'tech,breakout',
        isShort: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        performanceId: null,
      },
      {
        id: 3,
        ticker: 'TSLA',
        entryDate: new Date('2023-03-10'),
        entryPrice: 172.92,
        exitDate: new Date('2023-04-05'),
        exitPrice: 185.06,
        quantity: 8,
        fees: 9.99,
        notes: 'Swing trade based on technical support',
        tags: 'ev,tech,swing',
        isShort: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        performanceId: null,
      },
    ] as any[];
    
    // Test the analysis service
    const analysis = TradeAnalysisService.generateTradeAnalysis(sampleTrades);
    
    return NextResponse.json({
      success: true,
      message: 'Rule-based analysis test successful',
      data: analysis,
    });
  } catch (error) {
    console.error('Rule-based analysis test failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Rule-based analysis test failed',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
```

### 4. Update Type Definitions

Update the insights type definitions at `src/types/insights.ts`:

```typescript
// src/types/insights.ts

export interface TradeInsight {
  type: 'performance' | 'pattern' | 'risk' | 'opportunity';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: string;
}

export interface TradeAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  patterns: string[];
  suggestions: string[];
  metrics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
}

export interface AnalysisRequest {
  timeframe?: 'all' | 'week' | 'month' | 'quarter' | 'year';
  ticker?: string;
}
```

## Expected Outcome

- A comprehensive rule-based trade analysis system
- Statistical calculations for trading metrics
- Pattern recognition algorithms
- Actionable insights and suggestions
- API endpoints for accessing analysis
- No external API dependencies

## Benefits of Rule-Based Analysis

1. **No External Dependencies**: Works completely offline
2. **Consistent Results**: Same input always produces same output
3. **Fast Performance**: No network latency or API rate limits
4. **Privacy**: All data stays on the user's computer
5. **Customizable**: Easy to modify rules and add new analysis methods

## Next Steps

After completing this task, you can proceed to Phase 2: Core Functionality - Trade Management, starting with Task 2.1.1 (Implement GET /api/trades endpoint). 