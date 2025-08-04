import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...');
    
    const supabaseUrl = 'https://khfzxzkpdxxsxhbmntel.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZnp4emtwZHh4c3hoYm1udGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NTc4MjYsImV4cCI6MjA2OTUzMzgyNn0.rosbfFhNjsRxh2WAjZDNHLbvDGx1ZAtrCMsgLy2XB1w';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test 1: Check if trades table exists
    console.log('Testing trades table...');
    const { data: tradesData, error: tradesError } = await supabase
      .from('trades')
      .select('count', { count: 'exact', head: true });
    
    console.log('Trades table test:', { data: tradesData, error: tradesError });
    
    // Test 2: Check if users table exists
    console.log('Testing users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    console.log('Users table test:', { data: usersData, error: usersError });
    
    // Test 3: List all tables (if possible)
    console.log('Testing general connection...');
    const { data: generalData, error: generalError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    console.log('General connection test:', { data: generalData, error: generalError });
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        trades: {
          success: !tradesError,
          error: tradesError?.message || null,
          data: tradesData
        },
        users: {
          success: !usersError,
          error: usersError?.message || null,
          data: usersData
        },
        general: {
          success: !generalError,
          error: generalError?.message || null,
          data: generalData
        }
      }
    });
    
  } catch (error) {
    console.error('Supabase test error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Supabase test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 