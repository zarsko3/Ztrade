import { NextRequest, NextResponse } from 'next/server';
import { MarketAnalysisService } from '@/services/ai/market-analysis';

const marketAnalysisService = new MarketAnalysisService();

export interface MarketAnalysisResponse {
  symbol: string;
  timestamp: string;
  sentiment: any;
  volatility: any;
  trend: any;
  marketCondition: any;
  summary: {
    overallSentiment: string;
    keySignals: string[];
    riskLevel: string;
    tradingRecommendation: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const analysisType = searchParams.get('type') || 'all'; // all, sentiment, volatility, trend, condition

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Market analysis request: ${analysisType} for ${symbol}`);

    let response: Partial<MarketAnalysisResponse> = {
      symbol,
      timestamp: new Date().toISOString()
    };

    // Perform requested analysis
    if (analysisType === 'all' || analysisType === 'sentiment') {
      response.sentiment = await marketAnalysisService.analyzeMarketSentiment(symbol);
    }

    if (analysisType === 'all' || analysisType === 'volatility') {
      response.volatility = await marketAnalysisService.forecastVolatility(symbol);
    }

    if (analysisType === 'all' || analysisType === 'trend') {
      response.trend = await marketAnalysisService.analyzeTrend(symbol);
    }

    if (analysisType === 'all' || analysisType === 'condition') {
      response.marketCondition = await marketAnalysisService.analyzeMarketConditions(symbol);
    }

    // Generate summary for complete analysis
    if (analysisType === 'all' && response.sentiment && response.volatility && response.trend && response.marketCondition) {
      response.summary = generateMarketSummary(
        response.sentiment,
        response.volatility,
        response.trend,
        response.marketCondition
      );
    }

    return NextResponse.json({
      status: 'success',
      data: response
    });

  } catch (error) {
    console.error('Error in market analysis:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to analyze market data',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, analysisType = 'all' } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required in request body' },
        { status: 400 }
      );
    }

    console.log(`Custom market analysis request: ${analysisType} for ${symbol}`);

    let response: Partial<MarketAnalysisResponse> = {
      symbol,
      timestamp: new Date().toISOString()
    };

    // Perform requested analysis
    if (analysisType === 'all' || analysisType === 'sentiment') {
      response.sentiment = await marketAnalysisService.analyzeMarketSentiment(symbol);
    }

    if (analysisType === 'all' || analysisType === 'volatility') {
      response.volatility = await marketAnalysisService.forecastVolatility(symbol);
    }

    if (analysisType === 'all' || analysisType === 'trend') {
      response.trend = await marketAnalysisService.analyzeTrend(symbol);
    }

    if (analysisType === 'all' || analysisType === 'condition') {
      response.marketCondition = await marketAnalysisService.analyzeMarketConditions(symbol);
    }

    // Generate summary for complete analysis
    if (analysisType === 'all' && response.sentiment && response.volatility && response.trend && response.marketCondition) {
      response.summary = generateMarketSummary(
        response.sentiment,
        response.volatility,
        response.trend,
        response.marketCondition
      );
    }

    return NextResponse.json({
      status: 'success',
      data: response
    });

  } catch (error) {
    console.error('Error in custom market analysis:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to perform custom market analysis',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Generate comprehensive market summary
 */
function generateMarketSummary(
  sentiment: any,
  volatility: any,
  trend: any,
  marketCondition: any
): {
  overallSentiment: string;
  keySignals: string[];
  riskLevel: string;
  tradingRecommendation: string;
} {
  // Overall sentiment
  const overallSentiment = `${sentiment.overall.toUpperCase()} sentiment with ${sentiment.confidence.toFixed(0)}% confidence`;

  // Key signals
  const keySignals: string[] = [];
  
  if (sentiment.signals.length > 0) {
    const strongSignals = sentiment.signals.filter((s: any) => s.strength === 'strong');
    if (strongSignals.length > 0) {
      keySignals.push(`${strongSignals.length} strong ${strongSignals[0].type} signal(s)`);
    }
  }

  if (trend.strength > 70) {
    keySignals.push(`Strong ${trend.direction} trend`);
  }

  if (volatility.trend === 'increasing') {
    keySignals.push('Increasing volatility');
  }

  // Risk level
  let riskLevel = 'medium';
  if (marketCondition.riskLevel === 'high' || volatility.current > 0.04) {
    riskLevel = 'high';
  } else if (marketCondition.riskLevel === 'low' && volatility.current < 0.015) {
    riskLevel = 'low';
  }

  // Trading recommendation
  let tradingRecommendation = marketCondition.tradingStrategy;
  
  if (sentiment.signals.length > 0) {
    const buySignals = sentiment.signals.filter((s: any) => s.type === 'buy');
    const sellSignals = sentiment.signals.filter((s: any) => s.type === 'sell');
    
    if (buySignals.length > sellSignals.length) {
      tradingRecommendation += ' - Consider buying opportunities';
    } else if (sellSignals.length > buySignals.length) {
      tradingRecommendation += ' - Consider selling opportunities';
    }
  }

  return {
    overallSentiment,
    keySignals,
    riskLevel,
    tradingRecommendation
  };
} 