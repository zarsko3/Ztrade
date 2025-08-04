import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Direct Supabase test started');
    
    const supabaseUrl = 'https://khfzxzkpdxxsxhbmntel.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4emtwZHh4c3hoYm1udGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NTc4MjYsImV4cCI6MjA2OTUzMzgyNn0.rosbfFhNjsRxh2WAjZDNHLbvDGx1ZAtrCMsgLy2XB1w';
    
    console.log('Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client created successfully');
    
    const results: any = {
      success: true,
      timestamp: new Date().toISOString(),
      tests: {}
    };
    
    // Test 1: Direct trades query
    console.log('Test 1: Direct trades query');
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .limit(5);
      
      console.log('Trades query result:', { data, error });
      
      results.tests.tradesQuery = {
        success: !error,
        error: error?.message || null,
        errorCode: error?.code || null,
        errorDetails: error?.details || null,
        data: data ? `Found ${data.length} rows` : 'No data',
        sampleData: data && data.length > 0 ? data[0] : null
      };
    } catch (error) {
      console.error('Trades query error:', error);
      results.tests.tradesQuery = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name || 'Unknown'
      };
    }
    
    // Test 2: Direct users query
    console.log('Test 2: Direct users query');
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(5);
      
      console.log('Users query result:', { data, error });
      
      results.tests.usersQuery = {
        success: !error,
        error: error?.message || null,
        errorCode: error?.code || null,
        errorDetails: error?.details || null,
        data: data ? `Found ${data.length} rows` : 'No data',
        sampleData: data && data.length > 0 ? data[0] : null
      };
    } catch (error) {
      console.error('Users query error:', error);
      results.tests.usersQuery = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name || 'Unknown'
      };
    }
    
    // Test 3: Count query
    console.log('Test 3: Count query');
    try {
      const { count, error } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true });
      
      console.log('Count query result:', { count, error });
      
      results.tests.countQuery = {
        success: !error,
        error: error?.message || null,
        errorCode: error?.code || null,
        count: count || 0
      };
    } catch (error) {
      console.error('Count query error:', error);
      results.tests.countQuery = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name || 'Unknown'
      };
    }
    
    // Test 4: Test with specific user ID
    console.log('Test 4: Query with specific user ID');
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', 'user_30oUKghnkqoHLBXqZL8NyWcJTwC')
        .limit(5);
      
      console.log('User-specific query result:', { data, error });
      
      results.tests.userSpecificQuery = {
        success: !error,
        error: error?.message || null,
        errorCode: error?.code || null,
        data: data ? `Found ${data.length} rows for user` : 'No data for user',
        sampleData: data && data.length > 0 ? data[0] : null
      };
    } catch (error) {
      console.error('User-specific query error:', error);
      results.tests.userSpecificQuery = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name || 'Unknown'
      };
    }
    
    // Test 5: Check if we can query any table
    console.log('Test 5: Test any table access');
    try {
      const { data, error } = await supabase
        .from('performance')
        .select('*')
        .limit(1);
      
      console.log('Performance query result:', { data, error });
      
      results.tests.anyTableQuery = {
        success: !error,
        error: error?.message || null,
        errorCode: error?.code || null,
        data: data ? `Found ${data.length} rows` : 'No data'
      };
    } catch (error) {
      console.error('Any table query error:', error);
      results.tests.anyTableQuery = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name || 'Unknown'
      };
    }
    
    console.log('Direct test completed');
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('Direct test error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Direct test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 