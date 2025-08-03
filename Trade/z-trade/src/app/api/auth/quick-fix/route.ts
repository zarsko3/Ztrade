import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const currentEnv = {
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    console.log('🔍 Current environment:', currentEnv);

    // Check if DATABASE_URL is SQLite
    const isSQLite = currentEnv.DATABASE_URL?.startsWith('file:');
    const isPostgreSQL = currentEnv.DATABASE_URL?.startsWith('postgresql:');

    let recommendation = '';
    if (isSQLite) {
      recommendation = '❌ SQLite detected - This will not work in production. You need to switch to PostgreSQL/Supabase.';
    } else if (isPostgreSQL) {
      recommendation = '✅ PostgreSQL detected - This should work in production.';
    } else {
      recommendation = '⚠️ Unknown database type - Please check your DATABASE_URL.';
    }

    return NextResponse.json({
      success: true,
      currentEnvironment: currentEnv,
      analysis: {
        isSQLite,
        isPostgreSQL,
        recommendation
      },
      nextSteps: [
        '1. Go to your Vercel dashboard',
        '2. Settings → Environment Variables',
        '3. Update DATABASE_URL to use Supabase PostgreSQL',
        '4. Format: postgresql://postgres:[PASSWORD]@db.khfzxzkpdxxsxhbmntel.supabase.co:5432/postgres'
      ]
    });
  } catch (error) {
    console.error('❌ Quick fix check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Quick fix check failed',
        debug: { error: error.message }
      },
      { status: 500 }
    );
  }
} 