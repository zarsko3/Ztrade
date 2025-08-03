import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'all';

    const results: any = {
      timestamp: new Date().toISOString(),
      status: 'success'
    };

    // Database connectivity test
    if (testType === 'all' || testType === 'database') {
      try {
        const tradeCount = await prisma.trade.count();
        results.database = {
          status: 'success',
          tradeCount,
          message: 'Database connection successful'
        };
      } catch (error) {
        results.database = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown database error'
        };
      }
    }

    // Chart service test
    if (testType === 'all' || testType === 'charts') {
      results.charts = {
        status: 'skipped',
        message: 'Chart service removed - using Recharts instead'
      };
    }

    // API endpoints test
    if (testType === 'all' || testType === 'endpoints') {
      const endpoints = [
        '/api/trades',
        '/api/analytics/performance',
        '/api/export'
      ];

      results.endpoints = {};
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${request.nextUrl.origin}${endpoint}`);
          results.endpoints[endpoint] = {
            status: response.ok ? 'success' : 'error',
            statusCode: response.status,
            message: response.ok ? 'Endpoint accessible' : `HTTP ${response.status}`
          };
        } catch (error) {
          results.endpoints[endpoint] = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    }

    // Environment variables test
    if (testType === 'all' || testType === 'env') {
      const requiredEnvVars = [
        'DATABASE_URL',
        'CHART_IMG_API_KEY',
        'REDIS_URL'
      ];

      results.environment = {};
      
      for (const envVar of requiredEnvVars) {
        const value = process.env[envVar];
        results.environment[envVar] = {
          status: value ? 'set' : 'missing',
          value: value ? (envVar.includes('KEY') || envVar.includes('URL') ? '***' : value) : null
        };
      }
    }

    // Performance test
    if (testType === 'all' || testType === 'performance') {
      const startTime = Date.now();
      
      try {
        // Test database query performance
        const dbStart = Date.now();
        await prisma.trade.findMany({ take: 10 });
        const dbTime = Date.now() - dbStart;

        // Test chart generation performance
        const chartStart = Date.now();
        // Chart service removed - using Recharts instead
        const chartTime = Date.now() - chartStart;

        results.performance = {
          status: 'success',
          totalTime: Date.now() - startTime,
          databaseQueryTime: dbTime,
          chartGenerationTime: chartTime,
          message: 'Performance test completed'
        };
      } catch (error) {
        results.performance = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown performance error'
        };
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create_test_trade':
        const testTrade = await prisma.trade.create({
          data: {
            ticker: 'TEST',
            entryDate: new Date(),
            entryPrice: 100.00,
            quantity: 10,
            isShort: false,
            notes: 'Test trade created by API',
            tags: 'test,api'
          }
        });
        return NextResponse.json({
          status: 'success',
          message: 'Test trade created',
          trade: testTrade
        });

      case 'clear_test_data':
        const testTrades = await prisma.trade.findMany({
          where: { ticker: 'TEST' }
        });
        
        for (const trade of testTrades) {
          await prisma.trade.delete({
            where: { id: trade.id }
          });
        }
        
        return NextResponse.json({
          status: 'success',
          message: 'Test data cleared',
          deletedCount: testTrades.length
        });

      case 'generate_test_chart':
        return NextResponse.json({
          status: 'skipped',
          message: 'Chart service removed - using Recharts instead'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Test API POST error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 