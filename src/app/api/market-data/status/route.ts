import { NextRequest, NextResponse } from 'next/server';
import { unifiedMarketDataManager } from '../../../../services/unified-market-data-manager';

export async function GET(request: NextRequest) {
  try {
    const rateLimitStatus = unifiedMarketDataManager.getRateLimitStatus();
    const cacheStats = unifiedMarketDataManager.getCacheStats();
    const managerStatus = unifiedMarketDataManager.getStatus();
    
    return NextResponse.json({
      status: 'success',
      data: {
        rateLimits: {
          ...rateLimitStatus,
          remainingThisMinute: rateLimitStatus.maxRequestsPerMinute - rateLimitStatus.requestsThisMinute,
          remainingThisHour: rateLimitStatus.maxRequestsPerHour - rateLimitStatus.requestsThisHour,
          utilizationPercent: {
            minute: Math.round((rateLimitStatus.requestsThisMinute / rateLimitStatus.maxRequestsPerMinute) * 100),
            hour: Math.round((rateLimitStatus.requestsThisHour / rateLimitStatus.maxRequestsPerHour) * 100)
          }
        },
        cache: {
          ...cacheStats,
          cacheHitRate: cacheStats.hitRate
        },
        service: {
          status: 'operational',
          lastUpdated: new Date().toISOString(),
          uptime: process.uptime()
        },
        manager: managerStatus
      }
    });
  } catch (error) {
    console.error('Error getting market data status:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to get market data status',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 