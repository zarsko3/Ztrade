import { NextRequest, NextResponse } from 'next/server';
import { PredictiveModelingService } from '@/services/ai/predictive-modeling';
import { TradeService } from '@/services/trade-service';

const predictiveService = new PredictiveModelingService();
const tradeService = new TradeService();

export interface PredictiveAnalysisResponse {
  symbol: string;
  timestamp: string;
  pricePrediction: any;
  tradingSignals: any[];
  portfolioOptimization?: any;
  summary: {
    overallOutlook: string;
    keySignals: string[];
    riskLevel: string;
    recommendedAction: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const analysisType = searchParams.get('type') || 'all'; // all, prediction, signals, portfolio

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Predictive analysis request: ${analysisType} for ${symbol}`);

    let response: Partial<PredictiveAnalysisResponse> = {
      symbol,
      timestamp: new Date().toISOString()
    };

    // Perform requested analysis
    if (analysisType === 'all' || analysisType === 'prediction') {
      response.pricePrediction = await predictiveService.predictPrice(symbol);
    }

    if (analysisType === 'all' || analysisType === 'signals') {
      response.tradingSignals = await predictiveService.generateTradingSignals(symbol);
    }

    if (analysisType === 'all' || analysisType === 'portfolio') {
      // Get user's trades for portfolio optimization
      const tradesResponse = await tradeService.getTrades({ page: 1, limit: 1000 });
      const symbols = [...new Set(tradesResponse.trades.map((t: any) => t.ticker))];
      if (symbols.length > 0) {
        response.portfolioOptimization = await predictiveService.optimizePortfolio(tradesResponse.trades, symbols as string[]);
      }
    }

    // Generate summary for complete analysis
    if (analysisType === 'all' && response.pricePrediction && response.tradingSignals) {
      response.summary = generatePredictiveSummary(
        response.pricePrediction,
        response.tradingSignals,
        response.portfolioOptimization
      );
    }

    return NextResponse.json({
      status: 'success',
      data: response
    });

  } catch (error) {
    console.error('Error in predictive analysis:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to perform predictive analysis',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, analysisType = 'all', symbols = [] } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required in request body' },
        { status: 400 }
      );
    }

    console.log(`Custom predictive analysis request: ${analysisType} for ${symbol}`);

    let response: Partial<PredictiveAnalysisResponse> = {
      symbol,
      timestamp: new Date().toISOString()
    };

    // Perform requested analysis
    if (analysisType === 'all' || analysisType === 'prediction') {
      response.pricePrediction = await predictiveService.predictPrice(symbol);
    }

    if (analysisType === 'all' || analysisType === 'signals') {
      response.tradingSignals = await predictiveService.generateTradingSignals(symbol);
    }

    if (analysisType === 'all' || analysisType === 'portfolio') {
      // Use provided symbols or get from trades
      let symbolsToAnalyze = symbols;
      if (symbolsToAnalyze.length === 0) {
        const tradesResponse = await tradeService.getTrades({ page: 1, limit: 1000 });
        symbolsToAnalyze = [...new Set(tradesResponse.trades.map((t: any) => t.ticker))];
      }
      
      if (symbolsToAnalyze.length > 0) {
        const tradesResponse = await tradeService.getTrades({ page: 1, limit: 1000 });
        response.portfolioOptimization = await predictiveService.optimizePortfolio(tradesResponse.trades, symbolsToAnalyze);
      }
    }

    // Generate summary for complete analysis
    if (analysisType === 'all' && response.pricePrediction && response.tradingSignals) {
      response.summary = generatePredictiveSummary(
        response.pricePrediction,
        response.tradingSignals,
        response.portfolioOptimization
      );
    }

    return NextResponse.json({
      status: 'success',
      data: response
    });

  } catch (error) {
    console.error('Error in custom predictive analysis:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to perform custom predictive analysis',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Generate comprehensive predictive summary
 */
function generatePredictiveSummary(
  pricePrediction: any,
  tradingSignals: any[],
  portfolioOptimization?: any
): {
  overallOutlook: string;
  keySignals: string[];
  riskLevel: string;
  recommendedAction: string;
} {
  // Overall outlook based on probability distribution
  const { bullish, bearish, sideways } = pricePrediction.probability;
  let overallOutlook = '';
  
  if (bullish > bearish && bullish > sideways) {
    overallOutlook = `BULLISH outlook with ${bullish.toFixed(0)}% probability`;
  } else if (bearish > bullish && bearish > sideways) {
    overallOutlook = `BEARISH outlook with ${bearish.toFixed(0)}% probability`;
  } else {
    overallOutlook = `SIDEWAYS outlook with ${sideways.toFixed(0)}% probability`;
  }

  // Key signals
  const keySignals: string[] = [];
  
  if (tradingSignals.length > 0) {
    const strongSignals = tradingSignals.filter(s => s.strength === 'strong');
    if (strongSignals.length > 0) {
      keySignals.push(`${strongSignals.length} strong ${strongSignals[0].signal} signal(s)`);
    }
    
    const buySignals = tradingSignals.filter(s => s.signal === 'buy');
    const sellSignals = tradingSignals.filter(s => s.signal === 'sell');
    
    if (buySignals.length > 0) {
      keySignals.push(`${buySignals.length} buy opportunity(ies)`);
    }
    if (sellSignals.length > 0) {
      keySignals.push(`${sellSignals.length} sell opportunity(ies)`);
    }
  }

  // Risk level
  const riskLevel = pricePrediction.riskAssessment.level;

  // Recommended action
  let recommendedAction = 'Monitor market conditions';
  
  if (tradingSignals.length > 0) {
    const bestSignal = tradingSignals.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    if (bestSignal.confidence > 70) {
      recommendedAction = `Strong ${bestSignal.signal.toUpperCase()} signal - Consider ${bestSignal.signal}ing with ${bestSignal.confidence}% confidence`;
    } else if (bestSignal.confidence > 50) {
      recommendedAction = `Moderate ${bestSignal.signal.toUpperCase()} signal - Consider ${bestSignal.signal}ing with caution`;
    }
  }

  // Add portfolio recommendations if available
  if (portfolioOptimization && portfolioOptimization.recommendations.length > 0) {
    const highPriorityRecs = portfolioOptimization.recommendations.filter((r: any) => r.priority === 'high');
    if (highPriorityRecs.length > 0) {
      recommendedAction += ` | Portfolio: ${highPriorityRecs.length} high-priority action(s) recommended`;
    }
  }

  return {
    overallOutlook,
    keySignals,
    riskLevel,
    recommendedAction
  };
} 