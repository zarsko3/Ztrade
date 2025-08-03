import { NextRequest, NextResponse } from 'next/server';
import { finnhubService } from '@/services/finnhub-service';
import { alphaVantageService } from '@/services/alpha-vantage-service';
import { marketDataOptimizer } from '@/services/market-data-optimizer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'AAPL';
    
    console.log('Testing all market data APIs for symbol:', symbol);
    
    const results = {
      timestamp: new Date().toISOString(),
      symbol,
      tests: {
        yahooFinance: null as any,
        alphaVantage: null as any,
        finnhub: null as any,
        unifiedManager: null as any
      },
      summary: {
        totalTests: 4,
        passed: 0,
        failed: 0,
        sources: [] as string[]
      }
    };

    // Test 1: Yahoo Finance (via unified manager)
    try {
      console.log('Testing Yahoo Finance...');
      const yahooData = await marketDataOptimizer.getMarketData([symbol]);
      results.tests.yahooFinance = {
        success: true,
        data: yahooData[0],
        source: yahooData[0].source,
        dataQuality: yahooData[0].dataQuality
      };
      results.summary.passed++;
      results.summary.sources.push(yahooData[0].source);
    } catch (error) {
      results.tests.yahooFinance = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
      results.summary.failed++;
    }

    // Test 2: Alpha Vantage
    try {
      console.log('Testing Alpha Vantage...');
      const alphaVantageData = await alphaVantageService.getQuote(symbol);
      results.tests.alphaVantage = {
        success: true,
        data: alphaVantageData,
        source: alphaVantageData.source,
        dataQuality: alphaVantageData.dataQuality
      };
      results.summary.passed++;
      results.summary.sources.push(alphaVantageData.source);
    } catch (error) {
      results.tests.alphaVantage = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
      results.summary.failed++;
    }

    // Test 3: Finnhub News
    try {
      console.log('Testing Finnhub News...');
      const finnhubNews = await finnhubService.fetchFinancialNews(3);
      results.tests.finnhub = {
        success: true,
        data: {
          articlesCount: finnhubNews.length,
          articles: finnhubNews.slice(0, 2).map(article => ({
            title: article.title,
            category: article.category,
            sentiment: article.sentiment,
            publishedAt: article.publishedAt
          }))
        }
      };
      results.summary.passed++;
      results.summary.sources.push('finnhub-news');
    } catch (error) {
      results.tests.finnhub = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
      results.summary.failed++;
    }

    // Test 4: Unified Market Data Manager
    try {
      console.log('Testing Unified Market Data Manager...');
      const unifiedManager = (await import('@/services/unified-market-data-manager')).unifiedMarketDataManager;
      await unifiedManager.initialize([symbol]);
      const unifiedData = await unifiedManager.getSymbolData(symbol);
      results.tests.unifiedManager = {
        success: true,
        data: unifiedData,
        source: unifiedData?.source || 'unknown',
        dataQuality: unifiedData?.dataQuality || 'unknown'
      };
      results.summary.passed++;
      results.summary.sources.push(unifiedData?.source || 'unified');
    } catch (error) {
      results.tests.unifiedManager = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
      results.summary.failed++;
    }

    // Add rate limit status
    results.summary.rateLimits = {
      alphaVantage: alphaVantageService.getRateLimitStatus(),
      marketDataOptimizer: marketDataOptimizer.getRateLimitStatus()
    };

    console.log('API test results:', results.summary);

    return NextResponse.json({
      status: 'success',
      message: `API tests completed. ${results.summary.passed}/${results.summary.totalTests} passed.`,
      results
    });
  } catch (error) {
    console.error('Error testing APIs:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to test APIs',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 