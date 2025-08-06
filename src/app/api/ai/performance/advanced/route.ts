import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AdvancedPerformanceAnalytics } from '@/services/ai/performance-analytics';
import { TradeService } from '@/services/trade-service';

const analyticsService = new AdvancedPerformanceAnalytics();
const tradeService = new TradeService();

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
    const includeInsights = searchParams.get('includeInsights') === 'true';

    console.log('Advanced performance analysis request:', { ticker, period, includeInsights });

    // Get all trades
    const tradesResponse = await tradeService.getTrades({
      page: 1,
      limit: 1000, // Get all trades for analysis
      sortBy: 'entryDate',
      sortOrder: 'desc',
      ticker: ticker || undefined,
      userId: userId // Add user ID for data isolation
    });

    if (!tradesResponse.trades || tradesResponse.trades.length === 0) {
      return NextResponse.json({
        status: 'success',
        data: {
          metrics: analyticsService.getEmptyMetrics(),
          insights: [],
          analysis: {
            totalTradesAnalyzed: 0,
            closedTrades: 0,
            openTrades: 0,
            tickersAnalyzed: [],
            dateRange: {
              start: null,
              end: null
            }
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
          startDate = new Date(0); // All time
      }
      
      filteredTrades = tradesResponse.trades.filter(trade => 
        new Date(trade.entryDate) >= startDate
      );
    }

    // Calculate advanced metrics
    const metrics = await analyticsService.calculateAdvancedMetrics(filteredTrades);
    
    // Generate insights if requested
    const insights = includeInsights ? await analyticsService.generatePerformanceInsights(metrics) : [];

    // Prepare analysis summary
    const closedTrades = filteredTrades.filter(t => !t.isOpen);
    const openTrades = filteredTrades.filter(t => t.isOpen);
    const tickersAnalyzed = [...new Set(filteredTrades.map(t => t.ticker))];

    const analysis = {
      totalTradesAnalyzed: filteredTrades.length,
      closedTrades: closedTrades.length,
      openTrades: openTrades.length,
      tickersAnalyzed,
      dateRange: {
        start: filteredTrades[filteredTrades.length - 1]?.entryDate || null,
        end: filteredTrades[0]?.entryDate || null
      },
      period: period === 'all' ? 'All Time' : period
    };

    return NextResponse.json({
      status: 'success',
      data: {
        metrics,
        insights,
        analysis
      }
    });
  } catch (error) {
    console.error('Error in advanced performance analysis:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to analyze performance',
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

    console.log('Custom advanced performance analysis request:', { 
      tradeCount: trades.length, 
      options 
    });

    // Calculate advanced metrics for provided trades
    const metrics = await analyticsService.calculateAdvancedMetrics(trades);
    
    // Generate insights
    const insights = await analyticsService.generatePerformanceInsights(metrics);

    // Prepare analysis summary
    const closedTrades = trades.filter((t: any) => !t.isOpen);
    const openTrades = trades.filter((t: any) => t.isOpen);
    const tickersAnalyzed = [...new Set(trades.map((t: any) => t.ticker))];

    const analysis = {
      totalTradesAnalyzed: trades.length,
      closedTrades: closedTrades.length,
      openTrades: openTrades.length,
      tickersAnalyzed,
      dateRange: {
        start: trades[trades.length - 1]?.entryDate || null,
        end: trades[0]?.entryDate || null
      },
      customAnalysis: true,
      options
    };

    return NextResponse.json({
      status: 'success',
      data: {
        metrics,
        insights,
        analysis
      }
    });
  } catch (error) {
    console.error('Error in custom advanced performance analysis:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to analyze custom performance data',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 