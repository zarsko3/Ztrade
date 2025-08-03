import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };

    console.log('🔍 Environment check:', envCheck);

    return NextResponse.json({
      success: true,
      environment: envCheck,
      message: 'Environment variables check'
    });
  } catch (error) {
    console.error('❌ Environment check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Environment check failed',
        debug: { error: error.message }
      },
      { status: 500 }
    );
  }
} 