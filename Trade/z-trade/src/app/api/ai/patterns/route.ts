import { NextRequest, NextResponse } from 'next/server';
import { PatternRecognitionService } from '@/services/ai/pattern-recognition';
import { TradeService } from '@/services/trade-service';

const patternService = new PatternRecognitionService();
const tradeService = new TradeService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const limit = parseInt(searchParams.get('limit') || '50');
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.5');

    console.log('Pattern analysis request:', { ticker, limit, minConfidence });

    // Get all trades
    const tradesResponse = await tradeService.getTrades({
      page: 1,
      limit: 1000, // Get all trades for pattern analysis
      sortBy: 'entryDate',
      sortOrder: 'desc',
      ticker: ticker || undefined
    });

    if (!tradesResponse.trades || tradesResponse.trades.length === 0) {
      return NextResponse.json({
        status: 'success',
        data: {
          patterns: [],
          summary: {
            totalPatterns: 0,
            mostProfitablePattern: 'None',
            averageConfidence: 0,
            patternDistribution: {}
          },
          recommendations: ['No trades found for pattern analysis.']
        }
      });
    }

    // Detect patterns
    const patternResult = await patternService.detectPatterns(tradesResponse.trades);

    // Filter patterns by minimum confidence
    const filteredPatterns = patternResult.patterns.filter(pattern => 
      pattern.confidence >= minConfidence
    ).slice(0, limit);

    // Get recommendations
    const recommendations = await patternService.getPatternRecommendations(filteredPatterns);

    // Update summary with filtered results
    const filteredSummary = {
      totalPatterns: filteredPatterns.length,
      mostProfitablePattern: filteredPatterns.length > 0 
        ? filteredPatterns.reduce((best, current) => 
            current.performance.avgReturn > best.performance.avgReturn ? current : best
          ).name
        : 'None',
      averageConfidence: filteredPatterns.length > 0
        ? filteredPatterns.reduce((sum, pattern) => sum + pattern.confidence, 0) / filteredPatterns.length
        : 0,
      patternDistribution: filteredPatterns.reduce((dist, pattern) => {
        dist[pattern.type] = (dist[pattern.type] || 0) + 1;
        return dist;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      status: 'success',
      data: {
        patterns: filteredPatterns,
        summary: filteredSummary,
        recommendations,
        analysis: {
          totalTradesAnalyzed: tradesResponse.trades.length,
          closedTrades: tradesResponse.trades.filter(t => !t.isOpen).length,
          openTrades: tradesResponse.trades.filter(t => t.isOpen).length,
          tickersAnalyzed: [...new Set(tradesResponse.trades.map(t => t.ticker))],
          dateRange: {
            start: tradesResponse.trades[tradesResponse.trades.length - 1]?.entryDate,
            end: tradesResponse.trades[0]?.entryDate
          }
        }
      }
    });
  } catch (error) {
    console.error('Error in pattern analysis:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to analyze trading patterns',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trades, options = {} } = body;

    if (!trades || !Array.isArray(trades)) {
      return NextResponse.json(
        { error: 'Trades array is required' },
        { status: 400 }
      );
    }

    console.log('Custom pattern analysis request:', { 
      tradeCount: trades.length, 
      options 
    });

    // Detect patterns in provided trades
    const patternResult = await patternService.detectPatterns(trades);

    // Apply filters if provided
    const minConfidence = options.minConfidence || 0.5;
    const limit = options.limit || 50;
    const patternType = options.patternType;

    let filteredPatterns = patternResult.patterns.filter(pattern => 
      pattern.confidence >= minConfidence
    );

    if (patternType) {
      filteredPatterns = filteredPatterns.filter(pattern => 
        pattern.type === patternType
      );
    }

    filteredPatterns = filteredPatterns.slice(0, limit);

    // Get recommendations
    const recommendations = await patternService.getPatternRecommendations(filteredPatterns);

    // Update summary
    const filteredSummary = {
      totalPatterns: filteredPatterns.length,
      mostProfitablePattern: filteredPatterns.length > 0 
        ? filteredPatterns.reduce((best, current) => 
            current.performance.avgReturn > best.performance.avgReturn ? current : best
          ).name
        : 'None',
      averageConfidence: filteredPatterns.length > 0
        ? filteredPatterns.reduce((sum, pattern) => sum + pattern.confidence, 0) / filteredPatterns.length
        : 0,
      patternDistribution: filteredPatterns.reduce((dist, pattern) => {
        dist[pattern.type] = (dist[pattern.type] || 0) + 1;
        return dist;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      status: 'success',
      data: {
        patterns: filteredPatterns,
        summary: filteredSummary,
        recommendations,
        analysis: {
          totalTradesAnalyzed: trades.length,
          closedTrades: trades.filter((t: any) => !t.isOpen).length,
          openTrades: trades.filter((t: any) => t.isOpen).length,
          tickersAnalyzed: [...new Set(trades.map((t: any) => t.ticker))],
          filtersApplied: {
            minConfidence,
            limit,
            patternType: patternType || 'all'
          }
        }
      }
    });
  } catch (error) {
    console.error('Error in custom pattern analysis:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to analyze custom trading patterns',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 