import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    const supabaseUrl = 'https://khfzxzkpdxxsxhbmntel.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4emtwZHh4c3hoYm1udGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NTc4MjYsImV4cCI6MjA2OTUzMzgyNn0.rosbfFhNjsRxh2WAjZDNHLbvDGx1ZAtrCMsgLy2XB1w';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const results: any = {
      success: true,
      timestamp: new Date().toISOString(),
      connection: {
        url: supabaseUrl,
        keySet: !!supabaseAnonKey
      },
      tests: {}
    };
    
    // Test 1: Simple connection test
    console.log('Test 1: Simple connection test');
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .limit(1);
      
      results.tests.simpleQuery = {
        success: !error,
        error: error?.message || null,
        data: data ? `Found ${data.length} rows` : 'No data'
      };
    } catch (error) {
      results.tests.simpleQuery = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Test 2: Check if table exists by trying to get count
    console.log('Test 2: Count test');
    try {
      const { count, error } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true });
      
      results.tests.countTest = {
        success: !error,
        error: error?.message || null,
        count: count || 0
      };
    } catch (error) {
      results.tests.countTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Test 3: Try to list all tables using a different approach
    console.log('Test 3: List tables test');
    try {
      const { data, error } = await supabase
        .rpc('get_tables');
      
      results.tests.listTables = {
        success: !error,
        error: error?.message || null,
        data: data || 'No tables found'
      };
    } catch (error) {
      results.tests.listTables = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Test 4: Try to create a simple table to test permissions
    console.log('Test 4: Permission test');
    try {
      const { data, error } = await supabase
        .from('test_connection')
        .select('*')
        .limit(1);
      
      results.tests.permissionTest = {
        success: !error,
        error: error?.message || null,
        note: 'This test checks if we can query any table'
      };
    } catch (error) {
      results.tests.permissionTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Test 5: Check environment variables
    results.environment = {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV
    };
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('Connection test error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 