import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Test registration request received');
    
    // Check environment variables first
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length || 0,
    };

    console.log('✅ Environment check:', envCheck);

    // Try to parse the request body
    let body;
    try {
      body = await request.json();
      console.log('✅ Body parsed:', { 
        username: body.username, 
        hasPassword: !!body.password,
        hasEmail: !!body.email,
        bodyKeys: Object.keys(body)
      });
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          debug: { parseError: parseError.message }
        },
        { status: 400 }
      );
    }

    const { username, password, email, name } = body;

    // Validate required fields
    if (!username || !password) {
      console.log('❌ Missing required fields:', { username: !!username, password: !!password });
      return NextResponse.json(
        { 
          error: 'Username and password are required',
          debug: { providedFields: Object.keys(body) }
        },
        { status: 400 }
      );
    }

    // Validate username length
    if (username.length < 3 || username.length > 50) {
      console.log('❌ Invalid username length:', username.length);
      return NextResponse.json(
        { error: 'Username must be between 3 and 50 characters' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      console.log('❌ Password too short:', password.length);
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    console.log('✅ All validations passed');

    return NextResponse.json({
      success: true,
      message: 'Test registration validation passed',
      data: {
        username,
        hasEmail: !!email,
        hasName: !!name,
        environment: envCheck
      }
    });
  } catch (error) {
    console.error('❌ Test registration error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        debug: { error: error.message }
      },
      { status: 500 }
    );
  }
} 