import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AdvancedPerformanceAnalytics } from '@/services/ai/performance-analytics';
import { TradeService } from '@/services/trade-service';

const analyticsService = new AdvancedPerformanceAnalytics();
const tradeService = new TradeService();

export interface BehavioralAnalysis {
  emotionalState: 'confident' | 'fearful' | 'greedy' | 'neutral';
  decisionFatigue: number; // 0-100 scale
  tradingFrequency: number;
  positionSizingConsistency: number;
  riskTolerance: number;
  patternAdherence: number;
  tradingStyle: 'conservative' | 'moderate' | 'aggressive';
  timeOfDayPreference: string;
  dayOfWeekPreference: string;
  marketConditionAdaptation: number;
  stressIndicators: {
    overtrading: boolean;
    revengeTrading: boolean;
    fomoTrading: boolean;
    analysisParalysis: boolean;
  };
  improvementAreas: string[];
  strengths: string[];
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

    console.log('Behavioral analysis request:', { ticker, period });

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
          behavioralAnalysis: getEmptyBehavioralAnalysis(),
          insights: [],
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

    // Perform behavioral analysis
    const behavioralAnalysis = await performBehavioralAnalysis(filteredTrades);
    
    // Generate behavioral insights
    const insights = generateBehavioralInsights(behavioralAnalysis, filteredTrades);

    return NextResponse.json({
      status: 'success',
      data: {
        behavioralAnalysis,
        insights,
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
    console.error('Error in behavioral analysis:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to analyze behavioral patterns',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Perform comprehensive behavioral analysis
 */
async function performBehavioralAnalysis(trades: any[]): Promise<BehavioralAnalysis> {
  const closedTrades = trades.filter(t => !t.isOpen);
  
  if (closedTrades.length === 0) {
    return getEmptyBehavioralAnalysis();
  }

  // Analyze emotional state based on performance patterns
  const emotionalState = analyzeEmotionalState(closedTrades);
  
  // Calculate decision fatigue
  const decisionFatigue = calculateDecisionFatigue(closedTrades);
  
  // Analyze trading frequency
  const tradingFrequency = analyzeTradingFrequency(closedTrades);
  
  // Analyze position sizing consistency
  const positionSizingConsistency = analyzePositionSizingConsistency(closedTrades);
  
  // Analyze risk tolerance
  const riskTolerance = analyzeRiskTolerance(closedTrades);
  
  // Analyze pattern adherence
  const patternAdherence = analyzePatternAdherence(closedTrades);
  
  // Determine trading style
  const tradingStyle = determineTradingStyle(closedTrades);
  
  // Analyze time preferences
  const timeOfDayPreference = analyzeTimeOfDayPreference(closedTrades);
  const dayOfWeekPreference = analyzeDayOfWeekPreference(closedTrades);
  
  // Analyze market condition adaptation
  const marketConditionAdaptation = analyzeMarketConditionAdaptation(closedTrades);
  
  // Analyze stress indicators
  const stressIndicators = analyzeStressIndicators(closedTrades);
  
  // Create the behavioral analysis object
  const behavioralAnalysis = {
    emotionalState,
    decisionFatigue,
    tradingFrequency,
    positionSizingConsistency,
    riskTolerance,
    patternAdherence,
    tradingStyle,
    timeOfDayPreference,
    dayOfWeekPreference,
    marketConditionAdaptation,
    stressIndicators,
    improvementAreas: [] as string[],
    strengths: [] as string[]
  };
  
  // Identify improvement areas and strengths
  behavioralAnalysis.improvementAreas = identifyImprovementAreas(behavioralAnalysis);
  behavioralAnalysis.strengths = identifyStrengths(behavioralAnalysis);

  return behavioralAnalysis;
}

/**
 * Analyze emotional state based on trading patterns
 */
function analyzeEmotionalState(trades: any[]): 'confident' | 'fearful' | 'greedy' | 'neutral' {
  const recentTrades = trades.slice(0, 10); // Last 10 trades
  const winRate = recentTrades.filter(t => t.profitLoss! > 0).length / recentTrades.length;
  const averageReturn = recentTrades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / recentTrades.length;
  
  if (winRate > 0.7 && averageReturn > 5) {
    return 'confident';
  } else if (winRate < 0.3 && averageReturn < -5) {
    return 'fearful';
  } else if (winRate < 0.4 && averageReturn > 10) {
    return 'greedy';
  } else {
    return 'neutral';
  }
}

/**
 * Calculate decision fatigue based on trading frequency and performance
 */
function calculateDecisionFatigue(trades: any[]): number {
  const recentTrades = trades.slice(0, 20); // Last 20 trades
  const tradingFrequency = recentTrades.length / 30; // trades per month
  const performanceDecline = recentTrades.slice(0, 10).reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / 10 -
                             recentTrades.slice(10).reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / 10;
  
  let fatigue = 0;
  
  // High trading frequency increases fatigue
  if (tradingFrequency > 20) fatigue += 30;
  else if (tradingFrequency > 10) fatigue += 20;
  else if (tradingFrequency > 5) fatigue += 10;
  
  // Performance decline indicates fatigue
  if (performanceDecline < -5) fatigue += 40;
  else if (performanceDecline < -2) fatigue += 20;
  
  return Math.min(100, fatigue);
}

/**
 * Analyze trading frequency patterns
 */
function analyzeTradingFrequency(trades: any[]): number {
  const sortedTrades = trades.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
  const totalDays = (new Date(sortedTrades[sortedTrades.length - 1].entryDate).getTime() - new Date(sortedTrades[0].entryDate).getTime()) / (1000 * 60 * 60 * 24);
  
  return totalDays > 0 ? trades.length / (totalDays / 30) : 0; // trades per month
}

/**
 * Analyze position sizing consistency
 */
function analyzePositionSizingConsistency(trades: any[]): number {
  const positionSizes = trades.map(t => t.entryPrice * t.quantity);
  const averageSize = positionSizes.reduce((sum, size) => sum + size, 0) / positionSizes.length;
  const variance = positionSizes.reduce((sum, size) => sum + Math.pow(size - averageSize, 2), 0) / positionSizes.length;
  
  return Math.max(0, 1 - (Math.sqrt(variance) / averageSize));
}

/**
 * Analyze risk tolerance
 */
function analyzeRiskTolerance(trades: any[]): number {
  const winningTrades = trades.filter(t => t.profitLoss! > 0);
  const losingTrades = trades.filter(t => t.profitLoss! < 0);
  
  const averageWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + Math.abs(t.profitLoss!), 0) / winningTrades.length 
    : 0;
  
  const averageLoss = losingTrades.length > 0 
    ? losingTrades.reduce((sum, t) => sum + Math.abs(t.profitLoss!), 0) / losingTrades.length 
    : 0;
  
  return averageWin > 0 ? Math.min(1, averageLoss / averageWin) : 0;
}

/**
 * Analyze pattern adherence
 */
function analyzePatternAdherence(trades: any[]): number {
  // Simplified pattern adherence calculation
  // In a real implementation, this would compare against identified patterns
  const returns = trades.map(t => t.profitLossPercentage || 0);
  const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - averageReturn, 2), 0) / returns.length;
  
  // Lower variance indicates better pattern adherence
  return Math.max(0, 1 - (Math.sqrt(variance) / Math.abs(averageReturn)));
}

/**
 * Determine trading style
 */
function determineTradingStyle(trades: any[]): 'conservative' | 'moderate' | 'aggressive' {
  const averagePositionSize = trades.reduce((sum, t) => sum + (t.entryPrice * t.quantity), 0) / trades.length;
  const averageReturn = trades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / trades.length;
  const volatility = Math.sqrt(trades.reduce((sum, t) => sum + Math.pow((t.profitLossPercentage || 0) - averageReturn, 2), 0) / trades.length);
  
  if (averagePositionSize > 10000 || volatility > 15) {
    return 'aggressive';
  } else if (averagePositionSize < 5000 && volatility < 8) {
    return 'conservative';
  } else {
    return 'moderate';
  }
}

/**
 * Analyze time of day preferences
 */
function analyzeTimeOfDayPreference(trades: any[]): string {
  const timeSlots = {
    'Morning (9-11 AM)': 0,
    'Mid-Morning (11 AM-1 PM)': 0,
    'Afternoon (1-3 PM)': 0,
    'Late Afternoon (3-5 PM)': 0
  };
  
  trades.forEach(trade => {
    const hour = new Date(trade.entryDate).getHours();
    if (hour >= 9 && hour < 11) timeSlots['Morning (9-11 AM)' as keyof typeof timeSlots]++;
    else if (hour >= 11 && hour < 13) timeSlots['Mid-Morning (11 AM-1 PM)' as keyof typeof timeSlots]++;
    else if (hour >= 13 && hour < 15) timeSlots['Afternoon (1-3 PM)' as keyof typeof timeSlots]++;
    else if (hour >= 15 && hour < 17) timeSlots['Late Afternoon (3-5 PM)' as keyof typeof timeSlots]++;
  });
  
  return Object.entries(timeSlots).reduce((a, b) => timeSlots[a[0]] > timeSlots[b[0]] ? a : b)[0];
}

/**
 * Analyze day of week preferences
 */
function analyzeDayOfWeekPreference(trades: any[]): string {
  const dayCounts = {
    'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0
  };
  
  trades.forEach(trade => {
    const day = new Date(trade.entryDate).toLocaleDateString('en-US', { weekday: 'long' });
    if (dayCounts[day as keyof typeof dayCounts] !== undefined) {
      dayCounts[day as keyof typeof dayCounts]++;
    }
  });
  
  return Object.entries(dayCounts).reduce((a, b) => dayCounts[a[0] as keyof typeof dayCounts] > dayCounts[b[0] as keyof typeof dayCounts] ? a : b)[0];
}

/**
 * Analyze market condition adaptation
 */
function analyzeMarketConditionAdaptation(trades: any[]): number {
  // Simplified market condition adaptation
  // In a real implementation, this would compare performance in different market conditions
  const recentTrades = trades.slice(0, 10);
  const olderTrades = trades.slice(10, 20);
  
  if (olderTrades.length === 0) return 0.5;
  
  const recentPerformance = recentTrades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / recentTrades.length;
  const olderPerformance = olderTrades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / olderTrades.length;
  
  // Improvement indicates good adaptation
  return Math.max(0, Math.min(1, (recentPerformance - olderPerformance + 10) / 20));
}

/**
 * Analyze stress indicators
 */
function analyzeStressIndicators(trades: any[]): {
  overtrading: boolean;
  revengeTrading: boolean;
  fomoTrading: boolean;
  analysisParalysis: boolean;
} {
  const recentTrades = trades.slice(0, 10);
  const tradingFrequency = recentTrades.length / 30; // trades per month
  
  // Overtrading: high frequency with poor performance
  const overtrading = tradingFrequency > 15 && 
    recentTrades.reduce((sum, t) => sum + (t.profitLossPercentage || 0), 0) / recentTrades.length < -2;
  
  // Revenge trading: increasing position sizes after losses
  const losingTrades = recentTrades.filter(t => t.profitLoss! < 0);
  const revengeTrading = losingTrades.length > 0 && 
    losingTrades.slice(-3).reduce((sum, t) => sum + (t.entryPrice * t.quantity), 0) / 3 >
    losingTrades.slice(0, 3).reduce((sum, t) => sum + (t.entryPrice * t.quantity), 0) / 3;
  
  // FOMO trading: buying high and selling low
  const fomoTrading = recentTrades.some(t => t.profitLossPercentage! < -10);
  
  // Analysis paralysis: very low trading frequency
  const analysisParalysis = tradingFrequency < 2;
  
  return {
    overtrading,
    revengeTrading,
    fomoTrading,
    analysisParalysis
  };
}

/**
 * Identify improvement areas
 */
function identifyImprovementAreas(analysis: BehavioralAnalysis): string[] {
  const areas: string[] = [];
  
  if (analysis.decisionFatigue > 70) areas.push('Decision fatigue management');
  if (analysis.stressIndicators.overtrading) areas.push('Reduce overtrading');
  if (analysis.stressIndicators.revengeTrading) areas.push('Avoid revenge trading');
  if (analysis.stressIndicators.fomoTrading) areas.push('Control FOMO impulses');
  if (analysis.positionSizingConsistency < 0.5) areas.push('Improve position sizing consistency');
  if (analysis.patternAdherence < 0.3) areas.push('Better pattern adherence');
  
  return areas;
}

/**
 * Identify strengths
 */
function identifyStrengths(analysis: BehavioralAnalysis): string[] {
  const strengths: string[] = [];
  
  if (analysis.decisionFatigue < 30) strengths.push('Good decision management');
  if (analysis.positionSizingConsistency > 0.8) strengths.push('Consistent position sizing');
  if (analysis.patternAdherence > 0.7) strengths.push('Strong pattern adherence');
  if (analysis.marketConditionAdaptation > 0.7) strengths.push('Good market adaptation');
  if (!analysis.stressIndicators.overtrading) strengths.push('Disciplined trading frequency');
  if (!analysis.stressIndicators.revengeTrading) strengths.push('Emotional control');
  
  return strengths;
}

/**
 * Generate behavioral insights
 */
function generateBehavioralInsights(analysis: BehavioralAnalysis, trades: any[]): any[] {
  const insights: any[] = [];
  
  // Emotional state insights
  if (analysis.emotionalState === 'confident') {
    insights.push({
      type: 'behavioral',
      title: 'Confident Trading State',
      description: 'Your recent performance indicates a confident trading state. Maintain this positive mindset while staying disciplined.',
      impact: 'positive',
      confidence: 0.8
    });
  } else if (analysis.emotionalState === 'fearful') {
    insights.push({
      type: 'behavioral',
      title: 'Fearful Trading State',
      description: 'Recent losses may be affecting your confidence. Consider taking a break or reducing position sizes.',
      impact: 'negative',
      confidence: 0.7,
      recommendation: 'Focus on risk management and consider paper trading to rebuild confidence.'
    });
  }
  
  // Decision fatigue insights
  if (analysis.decisionFatigue > 70) {
    insights.push({
      type: 'behavioral',
      title: 'High Decision Fatigue',
      description: `Your decision fatigue score is ${analysis.decisionFatigue.toFixed(0)}%. Consider taking breaks between trading sessions.`,
      impact: 'negative',
      confidence: 0.8,
      recommendation: 'Implement trading breaks and limit daily trading decisions.'
    });
  }
  
  // Stress indicator insights
  if (analysis.stressIndicators.overtrading) {
    insights.push({
      type: 'behavioral',
      title: 'Overtrading Detected',
      description: 'You may be overtrading, which can lead to poor decision-making and increased losses.',
      impact: 'negative',
      confidence: 0.9,
      recommendation: 'Reduce trading frequency and focus on quality over quantity.'
    });
  }
  
  return insights;
}

/**
 * Get empty behavioral analysis
 */
function getEmptyBehavioralAnalysis(): BehavioralAnalysis {
  return {
    emotionalState: 'neutral',
    decisionFatigue: 0,
    tradingFrequency: 0,
    positionSizingConsistency: 0,
    riskTolerance: 0,
    patternAdherence: 0,
    tradingStyle: 'moderate',
    timeOfDayPreference: 'Morning (9-11 AM)',
    dayOfWeekPreference: 'Monday',
    marketConditionAdaptation: 0,
    stressIndicators: {
      overtrading: false,
      revengeTrading: false,
      fomoTrading: false,
      analysisParalysis: false
    },
    improvementAreas: [],
    strengths: []
  };
} 