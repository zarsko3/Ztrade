import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug registration request received');
    
    // Log headers
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    // Try to parse body
    let body;
    try {
      body = await request.json();
      console.log('✅ Body parsed successfully:', body);
    } catch (parseError) {
      console.log('❌ Body parse error:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON in request body',
          debug: { parseError: parseError.message }
        },
        { status: 400 }
      );
    }
    
    // Validate required fields
    const { username, password, email, name } = body;
    
    if (!username || !password) {
      console.log('❌ Missing required fields:', { username: !!username, password: !!password });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Username and password are required',
          debug: { receivedFields: Object.keys(body) }
        },
        { status: 400 }
      );
    }
    
    console.log('✅ All validations passed');
    
    // Return success for debugging
    return NextResponse.json({
      success: true,
      message: 'Registration validation passed',
      debug: {
        receivedData: { username, email, name },
        hasPassword: !!password,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Debug registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        debug: { error: error.message, timestamp: new Date().toISOString() }
      },
      { status: 500 }
    );
  }
} 