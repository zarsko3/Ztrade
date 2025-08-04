import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SupabaseService } from '@/services/supabase-service';

export async function GET(request: NextRequest) {
  try {
    console.log('=== MINIMAL TEST START ===');
    
    // Step 1: Test authentication
    console.log('1. Testing authentication...');
    const authResult = await auth();
    console.log('Auth result:', { userId: authResult.userId, authenticated: !!authResult.userId });
    
    if (!authResult.userId) {
      return NextResponse.json({ error: 'No user ID' }, { status: 401 });
    }
    
    // Step 2: Test service creation
    console.log('2. Creating SupabaseService...');
    const service = SupabaseService.getInstance();
    console.log('Service created:', service.constructor.name);
    
    // Step 3: Test direct database query
    console.log('3. Testing direct database query...');
    const { supabaseAdmin } = await import('@/lib/supabase');
    const { data, error, count } = await supabaseAdmin.from('trades').select('*', { count: 'exact' }).eq('user_id', authResult.userId).limit(5);
    
    console.log('Direct query result:', { 
      success: !error, 
      error: error?.message, 
      count: count || 0,
      dataCount: data?.length || 0 
    });
    
    if (error) {
      return NextResponse.json({ 
        error: 'Direct query failed', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }
    
    // Step 4: Test service method
    console.log('4. Testing service getTrades method...');
    const result = await service.getTrades({
      page: 1,
      limit: 5,
      userId: authResult.userId
    });
    
    console.log('Service method result:', {
      success: true,
      tradesCount: result.trades?.length || 0,
      pagination: result.pagination
    });
    
    console.log('=== MINIMAL TEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      auth: { userId: authResult.userId },
      directQuery: { count: count || 0, dataCount: data?.length || 0 },
      serviceMethod: { tradesCount: result.trades?.length || 0, pagination: result.pagination }
    });
    
  } catch (error) {
    console.error('=== MINIMAL TEST ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json({
      success: false,
      error: 'Minimal test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 