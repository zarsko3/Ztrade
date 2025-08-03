import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug registration request received');
    
    // Check environment variables
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length || 0,
      NODE_ENV: process.env.NODE_ENV,
    };

    console.log('✅ Environment check:', envCheck);

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('✅ Body parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { username, password, email, name } = body;

    // Validate input
    if (!username || !password) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    console.log('✅ Input validation passed');

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.log('❌ JWT_SECRET not set');
      return NextResponse.json(
        { error: 'JWT_SECRET not configured' },
        { status: 500 }
      );
    }

    console.log('✅ JWT_SECRET is set');

    // Try to register user
    console.log('✅ Calling AuthService.register...');
    const result = await AuthService.register({ username, password, email, name });
    
    console.log('✅ AuthService result:', { success: result.success, message: result.message });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      message: 'User registered successfully',
      debug: {
        environment: envCheck,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Debug registration error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        debug: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
} 