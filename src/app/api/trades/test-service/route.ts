import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SupabaseService } from '@/services/supabase-service';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing SupabaseService directly...');
    
    const results: any = {
      success: true,
      timestamp: new Date().toISOString(),
      tests: {}
    };
    
    // Test 1: Authentication
    console.log('Test 1: Authentication');
    try {
      const authResult = await auth();
      results.tests.authentication = {
        success: true,
        userId: authResult.userId,
        authenticated: !!authResult.userId
      };
    } catch (authError) {
      results.tests.authentication = {
        success: false,
        error: authError instanceof Error ? authError.message : 'Unknown error'
      };
    }
    
    // Test 2: Service instantiation
    console.log('Test 2: Service instantiation');
    try {
      const service = SupabaseService.getInstance();
      results.tests.serviceInstantiation = {
        success: true,
        serviceType: service.constructor.name,
        hasGetTrades: typeof service.getTrades === 'function'
      };
    } catch (serviceError) {
      results.tests.serviceInstantiation = {
        success: false,
        error: serviceError instanceof Error ? serviceError.message : 'Unknown error'
      };
    }
    
    // Test 3: Direct service method call
    console.log('Test 3: Direct service method call');
    try {
      const service = SupabaseService.getInstance();
      const userId = results.tests.authentication.userId;
      
      if (!userId) {
        results.tests.serviceMethod = {
          success: false,
          error: 'No user ID available'
        };
      } else {
        const tradesResult = await service.getTrades({
          page: 1,
          limit: 10,
          userId: userId
        });
        
        results.tests.serviceMethod = {
          success: true,
          tradesCount: tradesResult.trades?.length || 0,
          hasPagination: !!tradesResult.pagination,
          pagination: tradesResult.pagination
        };
      }
    } catch (methodError) {
      results.tests.serviceMethod = {
        success: false,
        error: methodError instanceof Error ? methodError.message : 'Unknown error',
        stack: methodError instanceof Error ? methodError.stack : undefined
      };
    }
    
    console.log('Service test completed');
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('Service test error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Service test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 