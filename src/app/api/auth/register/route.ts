import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Registration request received');
    console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);
    
    let body;
    try {
      body = await request.json();
      console.log('✅ Body parsed:', { username: body.username, hasPassword: !!body.password });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { username, password, email, name } = body;

    if (!username || !password) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    console.log('✅ Calling AuthService.register...');
    
    // Check JWT_SECRET before calling AuthService
    if (!process.env.JWT_SECRET) {
      console.log('❌ JWT_SECRET not set');
      return NextResponse.json(
        { error: 'Server configuration error - JWT_SECRET not set' },
        { status: 500 }
      );
    }
    
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
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 