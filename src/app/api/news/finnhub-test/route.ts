import { NextRequest, NextResponse } from 'next/server';
import { finnhubService } from '@/services/finnhub-service';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Finnhub integration...');
    
    // Test the Finnhub API directly
    const testNews = await finnhubService.fetchFinancialNews(3);
    
    console.log('Finnhub test successful:', {
      count: testNews.length,
      firstArticle: testNews[0]?.title,
      sources: testNews.map(n => n.source),
      categories: testNews.map(n => n.category)
    });
    
    return NextResponse.json({
      status: 'success',
      message: 'Finnhub integration working correctly',
      data: {
        count: testNews.length,
        articles: testNews,
        timestamp: new Date().toISOString(),
        websocketReady: true
      }
    });
  } catch (error) {
    console.error('Finnhub test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Finnhub test failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 