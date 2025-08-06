import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AdvancedPerformanceAnalytics } from '@/services/ai/performance-analytics';
import { PatternRecognitionService } from '@/services/ai/pattern-recognition';
import { TradeService } from '@/services/trade-service';

const analyticsService = new AdvancedPerformanceAnalytics();
const patternService = new PatternRecognitionService();
const tradeService = new TradeService();

export interface TradingInsight {
  id: string;
  type: 'performance' | 'risk' | 'behavioral' | 'pattern' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  recommendation?: string;
  actionItems?: string[];
  metrics: Record<string, number>;
  relatedTrades?: number[];
  timestamp: string;
}

export interface InsightSummary {
  totalInsights: number;
  highPriorityInsights: number;
  positiveInsights: number;
  negativeInsights: number;
  insightTypes: Record<string, number>;
  averageConfidence: number;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const period = searchParams.get('period') || 'all';
    const insightTypes = searchParams.get('types')?.split(',') || ['performance', 'risk', 'behavioral', 'pattern'];
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log('AI insights request:', { ticker, period, insightTypes, limit });

    // Get all trades
    const tradesResponse = await tradeService.getTrades({
      page: 1,
      limit: 1000,
      sortBy: 'entryDate',
      sortOrder: 'desc',
      ticker: ticker || undefined,
      userId: userId // Add user ID for data isolation
    });

    if (!tradesResponse.trades || tradesResponse.trades.length === 0) {
      return NextResponse.json({
        status: 'success',
        data: {
          insights: [],
          summary: getEmptyInsightSummary(),
          analysis: {
            totalTradesAnalyzed: 0,
            period: period === 'all' ? 'All Time' : period
          }
        }
      });
    }

    // Filter trades by period if specified
    let filteredTrades = tradesResponse.trades;
    if (period !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '1m':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3m':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6m':
          startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      filteredTrades = tradesResponse.trades.filter(trade => 
        new Date(trade.entryDate) >= startDate
      );
    }

    // Generate comprehensive insights
    const insights = await generateComprehensiveInsights(filteredTrades, insightTypes);
    
    // Filter insights by requested types
    const filteredInsights = insights.filter(insight => insightTypes.includes(insight.type));
    
    // Sort by priority and confidence
    const sortedInsights = filteredInsights
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, limit);

    // Generate insight summary
    const summary = generateInsightSummary(sortedInsights);

    return NextResponse.json({
      status: 'success',
      data: {
        insights: sortedInsights,
        summary,
        analysis: {
          totalTradesAnalyzed: filteredTrades.length,
          period: period === 'all' ? 'All Time' : period,
          dateRange: {
            start: filteredTrades[filteredTrades.length - 1]?.entryDate || null,
            end: filteredTrades[0]?.entryDate || null
          }
        }
      }
    });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to generate insights',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Generate comprehensive trading insights
 */
async function generateComprehensiveInsights(trades: any[], insightTypes: string[]): Promise<TradingInsight[]> {
  const insights: TradingInsight[] = [];
  const timestamp = new Date().toISOString();

  // Performance insights
  if (insightTypes.includes('performance')) {
    const performanceInsights = await generatePerformanceInsights(trades, timestamp);
    insights.push(...performanceInsights);
  }

  // Risk insights
  if (insightTypes.includes('risk')) {
    const riskInsights = await generateRiskInsights(trades, timestamp);
    insights.push(...riskInsights);
  }

  // Behavioral insights
  if (insightTypes.includes('behavioral')) {
    const behavioralInsights = await generateBehavioralInsights(trades, timestamp);
    insights.push(...behavioralInsights);
  }

  // Pattern insights
  if (insightTypes.includes('pattern')) {
    const patternInsights = await generatePatternInsights(trades, timestamp);
    insights.push(...patternInsights);
  }

  // Opportunity insights
  if (insightTypes.includes('opportunity')) {
    const opportunityInsights = await generateOpportunityInsights(trades, timestamp);
    insights.push(...opportunityInsights);
  }

  // Warning insights
  if (insightTypes.includes('warning')) {
    const warningInsights = await generateWarningInsights(trades, timestamp);
    insights.push(...warningInsights);
  }

  return insights;
}

/**
 * Generate performance-based insights
 */
async function generatePerformanceInsights(trades: any[], timestamp: string): Promise<TradingInsight[]> {
  const insights: TradingInsight[] = [];
  const closedTrades = trades.filter(t => !t.isOpen);
  
  if (closedTrades.length === 0) return insights;

  const winRate = closedTrades.filter(t => t.profitLoss! > 0).length / closedTrades.length;
  const averageReturn = closedTrades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / closedTrades.length;
  const totalPnL = closedTrades.reduce((sum, t) => sum + t.profitLoss!, 0);

  // Win rate insights
  if (winRate > 0.7) {
    insights.push({
      id: `performance_winrate_${Date.now()}`,
      type: 'performance',
      title: 'Exceptional Win Rate',
      description: `Your win rate of ${(winRate * 100).toFixed(1)}% is exceptional. Your trade selection criteria are working very well.`,
      impact: 'positive',
      confidence: 0.9,
      priority: 'medium',
      recommendation: 'Consider scaling up position sizes gradually while maintaining your current selection criteria.',
      actionItems: [
        'Review your best-performing trades to identify common patterns',
        'Consider increasing position sizes by 10-20%',
        'Document your selection criteria for future reference'
      ],
      metrics: { winRate, totalTrades: closedTrades.length },
      timestamp
    });
  } else if (winRate < 0.4) {
    insights.push({
      id: `performance_winrate_low_${Date.now()}`,
      type: 'performance',
      title: 'Low Win Rate Detected',
      description: `Your win rate of ${(winRate * 100).toFixed(1)}% indicates room for improvement in trade selection.`,
      impact: 'negative',
      confidence: 0.8,
      priority: 'high',
      recommendation: 'Review your entry criteria and consider tightening your selection process.',
      actionItems: [
        'Analyze your losing trades to identify common patterns',
        'Tighten your entry criteria',
        'Consider reducing position sizes until win rate improves'
      ],
      metrics: { winRate, totalTrades: closedTrades.length },
      timestamp
    });
  }

  // Return insights
  if (averageReturn > 5) {
    insights.push({
      id: `performance_return_high_${Date.now()}`,
      type: 'performance',
      title: 'Strong Average Returns',
      description: `Your average return of ${averageReturn.toFixed(2)}% per trade is excellent.`,
      impact: 'positive',
      confidence: 0.8,
      priority: 'medium',
      recommendation: 'Your strategy is generating strong returns. Consider optimizing position sizing.',
      metrics: { averageReturn, totalPnL },
      timestamp
    });
  }

  return insights;
}

/**
 * Generate risk-based insights
 */
async function generateRiskInsights(trades: any[], timestamp: string): Promise<TradingInsight[]> {
  const insights: TradingInsight[] = [];
  const closedTrades = trades.filter(t => !t.isOpen);
  
  if (closedTrades.length === 0) return insights;

  const returns = closedTrades.map(t => t.profitLossPercentage || 0);
  const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - averageReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);

  // Volatility insights
  if (volatility > 15) {
    insights.push({
      id: `risk_volatility_high_${Date.now()}`,
      type: 'risk',
      title: 'High Portfolio Volatility',
      description: `Your portfolio volatility of ${volatility.toFixed(2)}% is quite high, indicating significant risk.`,
      impact: 'negative',
      confidence: 0.8,
      priority: 'high',
      recommendation: 'Consider implementing better risk management and position sizing.',
      actionItems: [
        'Reduce position sizes to 1-2% of portfolio per trade',
        'Implement stop-loss orders on all positions',
        'Consider diversifying across more positions'
      ],
      metrics: { volatility, averageReturn },
      timestamp
    });
  }

  // Drawdown insights
  const maxDrawdown = calculateMaxDrawdown(returns);
  if (maxDrawdown > 20) {
    insights.push({
      id: `risk_drawdown_high_${Date.now()}`,
      type: 'risk',
      title: 'Significant Drawdown Detected',
      description: `Your maximum drawdown of ${maxDrawdown.toFixed(2)}% is concerning and indicates poor risk management.`,
      impact: 'negative',
      confidence: 0.9,
      priority: 'high',
      recommendation: 'Implement strict risk management rules immediately.',
      actionItems: [
        'Set maximum 5% drawdown limit',
        'Implement daily loss limits',
        'Review and adjust position sizing'
      ],
      metrics: { maxDrawdown },
      timestamp
    });
  }

  return insights;
}

/**
 * Generate behavioral insights
 */
async function generateBehavioralInsights(trades: any[], timestamp: string): Promise<TradingInsight[]> {
  const insights: TradingInsight[] = [];
  const closedTrades = trades.filter(t => !t.isOpen);
  
  if (closedTrades.length === 0) return insights;

  // Trading frequency analysis
  const tradingFrequency = closedTrades.length / 30; // trades per month
  if (tradingFrequency > 20) {
    insights.push({
      id: `behavioral_overtrading_${Date.now()}`,
      type: 'behavioral',
      title: 'Potential Overtrading',
      description: `You're averaging ${tradingFrequency.toFixed(1)} trades per month, which may indicate overtrading.`,
      impact: 'negative',
      confidence: 0.7,
      priority: 'medium',
      recommendation: 'Focus on quality over quantity. Reduce trading frequency and wait for high-probability setups.',
      actionItems: [
        'Set a maximum daily trade limit',
        'Implement a cooling-off period between trades',
        'Focus on higher-quality setups only'
      ],
      metrics: { tradingFrequency },
      timestamp
    });
  }

  // Position sizing consistency
  const positionSizes = closedTrades.map(t => t.entryPrice * t.quantity);
  const averageSize = positionSizes.reduce((sum, size) => sum + size, 0) / positionSizes.length;
  const sizeVariance = positionSizes.reduce((sum, size) => sum + Math.pow(size - averageSize, 2), 0) / positionSizes.length;
  const sizeConsistency = 1 - (Math.sqrt(sizeVariance) / averageSize);

  if (sizeConsistency < 0.5) {
    insights.push({
      id: `behavioral_position_sizing_${Date.now()}`,
      type: 'behavioral',
      title: 'Inconsistent Position Sizing',
      description: 'Your position sizes vary significantly, indicating emotional decision-making.',
      impact: 'negative',
      confidence: 0.8,
      priority: 'medium',
      recommendation: 'Implement a fixed position sizing strategy based on account size and risk tolerance.',
      actionItems: [
        'Use a fixed percentage of account per trade (1-2%)',
        'Create a position sizing calculator',
        'Document your position sizing rules'
      ],
      metrics: { sizeConsistency, averageSize },
      timestamp
    });
  }

  return insights;
}

/**
 * Generate pattern-based insights
 */
async function generatePatternInsights(trades: any[], timestamp: string): Promise<TradingInsight[]> {
  const insights: TradingInsight[] = [];
  
  try {
    const patternResult = await patternService.detectPatterns(trades);
    
    if (patternResult.patterns.length > 0) {
      const bestPattern = patternResult.patterns.reduce((best, current) => 
        current.performance.avgReturn > best.performance.avgReturn ? current : best
      );

      insights.push({
        id: `pattern_best_${Date.now()}`,
        type: 'pattern',
        title: `Best Performing Pattern: ${bestPattern.name}`,
        description: `Your ${bestPattern.name} pattern has a ${(bestPattern.performance.winRate * 100).toFixed(1)}% win rate and ${bestPattern.performance.avgReturn.toFixed(2)}% average return.`,
        impact: 'positive',
        confidence: bestPattern.confidence,
        priority: 'medium',
        recommendation: 'Focus on identifying and trading this pattern more frequently.',
        actionItems: [
          'Study the characteristics of this pattern',
          'Look for similar setups in the market',
          'Consider increasing position sizes for this pattern'
        ],
        metrics: {
          winRate: bestPattern.performance.winRate,
          avgReturn: bestPattern.performance.avgReturn,
          confidence: bestPattern.confidence
        },
        timestamp
      });
    }
  } catch (error) {
    console.error('Error generating pattern insights:', error);
  }

  return insights;
}

/**
 * Generate opportunity insights
 */
async function generateOpportunityInsights(trades: any[], timestamp: string): Promise<TradingInsight[]> {
  const insights: TradingInsight[] = [];
  const closedTrades = trades.filter(t => !t.isOpen);
  
  if (closedTrades.length === 0) return insights;

  // Analyze time-based opportunities
  const timeAnalysis = analyzeTimeBasedOpportunities(closedTrades);
  if (timeAnalysis.bestTimeSlot) {
    insights.push({
      id: `opportunity_time_${Date.now()}`,
      type: 'opportunity',
      title: 'Time-Based Trading Opportunity',
      description: `Your trades perform best during ${timeAnalysis.bestTimeSlot} with ${(timeAnalysis.bestTimeWinRate * 100).toFixed(1)}% win rate.`,
      impact: 'positive',
      confidence: 0.7,
      priority: 'medium',
      recommendation: 'Focus your trading activity during this time period.',
      metrics: {
        bestTimeWinRate: timeAnalysis.bestTimeWinRate,
        bestTimeReturn: timeAnalysis.bestTimeReturn
      },
      timestamp
    });
  }

  return insights;
}

/**
 * Generate warning insights
 */
async function generateWarningInsights(trades: any[], timestamp: string): Promise<TradingInsight[]> {
  const insights: TradingInsight[] = [];
  const closedTrades = trades.filter(t => !t.isOpen);
  
  if (closedTrades.length === 0) return insights;

  // Recent performance decline
  const recentTrades = closedTrades.slice(0, 5);
  const olderTrades = closedTrades.slice(5, 10);
  
  if (olderTrades.length > 0) {
    const recentPerformance = recentTrades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / recentTrades.length;
    const olderPerformance = olderTrades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / olderTrades.length;
    
    if (recentPerformance < olderPerformance - 10) {
      insights.push({
        id: `warning_performance_decline_${Date.now()}`,
        type: 'warning',
        title: 'Recent Performance Decline',
        description: `Your recent performance has declined significantly. Recent trades average ${recentPerformance.toFixed(2)}% vs previous ${olderPerformance.toFixed(2)}%.`,
        impact: 'negative',
        confidence: 0.8,
        priority: 'high',
        recommendation: 'Review recent trades and consider taking a break to reassess your strategy.',
        actionItems: [
          'Analyze recent losing trades',
          'Consider reducing position sizes',
          'Take a short trading break'
        ],
        metrics: {
          recentPerformance,
          olderPerformance,
          decline: olderPerformance - recentPerformance
        },
        timestamp
      });
    }
  }

  return insights;
}

/**
 * Calculate maximum drawdown
 */
function calculateMaxDrawdown(returns: number[]): number {
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
 * Analyze time-based opportunities
 */
function analyzeTimeBasedOpportunities(trades: any[]) {
  const timeSlots: Record<string, { trades: any[], winRate: number, avgReturn: number }> = {
    'Morning (9-11 AM)': { trades: [], winRate: 0, avgReturn: 0 },
    'Mid-Morning (11 AM-1 PM)': { trades: [], winRate: 0, avgReturn: 0 },
    'Afternoon (1-3 PM)': { trades: [], winRate: 0, avgReturn: 0 },
    'Late Afternoon (3-5 PM)': { trades: [], winRate: 0, avgReturn: 0 }
  };

  trades.forEach(trade => {
    const hour = new Date(trade.entryDate).getHours();
    let slot: string;
    
    if (hour >= 9 && hour < 11) slot = 'Morning (9-11 AM)';
    else if (hour >= 11 && hour < 13) slot = 'Mid-Morning (11 AM-1 PM)';
    else if (hour >= 13 && hour < 15) slot = 'Afternoon (1-3 PM)';
    else if (hour >= 15 && hour < 17) slot = 'Late Afternoon (3-5 PM)';
    else return;

    timeSlots[slot as keyof typeof timeSlots].trades.push(trade);
  });

  // Calculate metrics for each time slot
  Object.keys(timeSlots).forEach(slot => {
    const slotKey = slot as keyof typeof timeSlots;
    const slotData = timeSlots[slotKey];
    if (slotData.trades.length > 0) {
      slotData.winRate = slotData.trades.filter(t => t.profitLoss! > 0).length / slotData.trades.length;
      slotData.avgReturn = slotData.trades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / slotData.trades.length;
    }
  });

  // Find best performing time slot
  const bestSlot = Object.entries(timeSlots).reduce((best, [slot, data]) => {
    if (data.trades.length >= 3 && data.winRate > best.winRate) {
      return { slot, winRate: data.winRate, avgReturn: data.avgReturn };
    }
    return best;
  }, { slot: '', winRate: 0, avgReturn: 0 });

  return {
    bestTimeSlot: bestSlot.slot,
    bestTimeWinRate: bestSlot.winRate,
    bestTimeReturn: bestSlot.avgReturn
  };
}

/**
 * Generate insight summary
 */
function generateInsightSummary(insights: TradingInsight[]): InsightSummary {
  const highPriorityInsights = insights.filter(i => i.priority === 'high').length;
  const positiveInsights = insights.filter(i => i.impact === 'positive').length;
  const negativeInsights = insights.filter(i => i.impact === 'negative').length;
  
  const insightTypes = insights.reduce((acc, insight) => {
    acc[insight.type] = (acc[insight.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const averageConfidence = insights.length > 0 
    ? insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length 
    : 0;

  return {
    totalInsights: insights.length,
    highPriorityInsights,
    positiveInsights,
    negativeInsights,
    insightTypes,
    averageConfidence
  };
}

/**
 * Get empty insight summary
 */
function getEmptyInsightSummary(): InsightSummary {
  return {
    totalInsights: 0,
    highPriorityInsights: 0,
    positiveInsights: 0,
    negativeInsights: 0,
    insightTypes: {},
    averageConfidence: 0
  };
} 