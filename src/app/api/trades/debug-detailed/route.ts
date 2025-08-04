import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Detailed debug endpoint called');
    
    const results: any = {
      success: true,
      timestamp: new Date().toISOString(),
      steps: {}
    };
    
    // Step 1: Environment check
    console.log('Step 1: Environment check');
    results.steps.environment = {
      NODE_ENV: process.env.NODE_ENV,
      USE_SUPABASE: process.env.USE_SUPABASE,
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
    };
    
    // Step 2: Authentication check
    console.log('Step 2: Authentication check');
    try {
      const authResult = await auth();
      results.steps.authentication = {
        success: true,
        userId: authResult.userId,
        authenticated: !!authResult.userId
      };
    } catch (authError) {
      results.steps.authentication = {
        success: false,
        error: authError instanceof Error ? authError.message : 'Unknown error'
      };
    }
    
    // Step 3: Service factory check
    console.log('Step 3: Service factory check');
    try {
      const { getTradeService } = await import('@/services/trade-service-factory');
      const service = getTradeService();
      results.steps.factory = {
        success: true,
        serviceType: service.constructor.name,
        serviceClass: service.constructor.toString(),
        hasGetTrades: typeof service.getTrades === 'function',
        hasGetTradeById: typeof service.getTradeById === 'function'
      };
    } catch (factoryError) {
      results.steps.factory = {
        success: false,
        error: factoryError instanceof Error ? factoryError.message : 'Unknown error'
      };
    }
    
    // Step 4: Direct Supabase import check
    console.log('Step 4: Direct Supabase import check');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = 'https://khfzxzkpdxxsxhbmntel.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4emtwZHh4c3hoYm1udGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NTc4MjYsImV4cCI6MjA2OTUzMzgyNn0.rosbfFhNjsRxh2WAjZDNHLbvDGx1ZAtrCMsgLy2XB1w';
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      results.steps.supabaseImport = {
        success: true,
        clientCreated: !!supabase
      };
    } catch (supabaseError) {
      results.steps.supabaseImport = {
        success: false,
        error: supabaseError instanceof Error ? supabaseError.message : 'Unknown error'
      };
    }
    
    // Step 5: Supabase connection test
    console.log('Step 5: Supabase connection test');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = 'https://khfzxzkpdxxsxhbmntel.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4emtwZHh4c3hoYm1udGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NTc4MjYsImV4cCI6MjA2OTUzMzgyNn0.rosbfFhNjsRxh2WAjZDNHLbvDGx1ZAtrCMsgLy2XB1w';
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.from('trades').select('count', { count: 'exact', head: true });
      
      results.steps.supabaseConnection = {
        success: !error,
        error: error?.message || null,
        data: data
      };
    } catch (connectionError) {
      results.steps.supabaseConnection = {
        success: false,
        error: connectionError instanceof Error ? connectionError.message : 'Unknown error'
      };
    }
    
    // Step 6: Service method test
    console.log('Step 6: Service method test');
    try {
      const { getTradeService } = await import('@/services/trade-service-factory');
      const service = getTradeService();
      
      // Test the getTrades method
      const testRequest = {
        page: 1,
        limit: 10,
        userId: results.steps.authentication.userId
      };
      
      const tradesResult = await service.getTrades(testRequest);
      results.steps.serviceMethod = {
        success: true,
        tradesCount: tradesResult.trades?.length || 0,
        hasPagination: !!tradesResult.pagination
      };
    } catch (methodError) {
      results.steps.serviceMethod = {
        success: false,
        error: methodError instanceof Error ? methodError.message : 'Unknown error'
      };
    }
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('Detailed debug endpoint error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Detailed debug endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 