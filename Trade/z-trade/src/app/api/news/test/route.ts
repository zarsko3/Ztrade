import { NextRequest, NextResponse } from 'next/server';
import { newsService } from '@/services/news-service';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing News API integration...');
    
    // Test the News API directly
    const testNews = await newsService.fetchFinancialNews(3);
    
    console.log('News API test successful:', {
      count: testNews.length,
      firstArticle: testNews[0]?.title,
      sources: testNews.map(n => n.source)
    });
    
    return NextResponse.json({
      status: 'success',
      message: 'News API integration working correctly',
      data: {
        count: testNews.length,
        articles: testNews,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('News API test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'News API test failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 