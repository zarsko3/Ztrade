import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug endpoint called');
    
    // Test 1: Environment variables
    console.log('1. Checking environment variables...');
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      USE_SUPABASE: process.env.USE_SUPABASE,
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
    };
    console.log('Environment info:', envInfo);
    
    // Test 2: Authentication
    console.log('2. Testing authentication...');
    let authResult;
    try {
      authResult = await auth();
      console.log('Auth result:', { userId: authResult.userId ? 'PRESENT' : 'MISSING' });
    } catch (authError) {
      console.error('Auth error:', authError);
      authResult = { userId: null };
    }
    
    // Test 3: Supabase connection
    console.log('3. Testing Supabase connection...');
    let supabaseTest = { success: false, error: null };
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = 'https://khfzxzkpdxxsxhbmntel.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4emtwZHh4c3hoYm1udGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NTc4MjYsImV4cCI6MjA2OTUzMzgyNn0.rosbfFhNjsRxh2WAjZDNHLbvDGx1ZAtrCMsgLy2XB1w';
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.from('trades').select('count', { count: 'exact', head: true });
      
      if (error) {
        supabaseTest = { success: false, error: error.message };
      } else {
        supabaseTest = { success: true, error: null };
      }
    } catch (supabaseError) {
      supabaseTest = { success: false, error: supabaseError instanceof Error ? supabaseError.message : 'Unknown error' };
    }
    
    // Test 4: Service factory
    console.log('4. Testing service factory...');
    let factoryTest = { success: false, error: null, serviceType: null };
    try {
      const { getTradeService } = await import('@/services/trade-service-factory');
      const service = getTradeService();
      factoryTest = { 
        success: true, 
        error: null, 
        serviceType: service.constructor.name 
      };
    } catch (factoryError) {
      factoryTest = { 
        success: false, 
        error: factoryError instanceof Error ? factoryError.message : 'Unknown error',
        serviceType: null
      };
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envInfo,
      authentication: {
        userId: authResult.userId,
        authenticated: !!authResult.userId
      },
      supabase: supabaseTest,
      factory: factoryTest
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Debug endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 