import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Detailed Environment Variable Check');
    
    const envCheck = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: {
          set: !!process.env.DATABASE_URL,
          type: process.env.DATABASE_URL?.startsWith('postgresql:') ? 'PostgreSQL' : 
                process.env.DATABASE_URL?.startsWith('file:') ? 'SQLite' : 'Unknown',
          preview: process.env.DATABASE_URL ? 
            process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@') : 'Not set',
          length: process.env.DATABASE_URL?.length || 0
        },
        JWT_SECRET: {
          set: !!process.env.JWT_SECRET,
          length: process.env.JWT_SECRET?.length || 0,
          preview: process.env.JWT_SECRET ? 
            `${process.env.JWT_SECRET.substring(0, 8)}...` : 'Not set'
        }
      },
      issues: [],
      recommendations: []
    };

    // Check for issues
    if (!process.env.DATABASE_URL) {
      envCheck.issues.push('DATABASE_URL is not set');
      envCheck.recommendations.push({
        type: 'critical',
        title: 'Missing DATABASE_URL',
        steps: [
          '1. Go to Vercel Dashboard',
          '2. Select your project',
          '3. Go to Settings → Environment Variables',
          '4. Add DATABASE_URL with your Supabase connection string',
          '5. Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres'
        ]
      });
    } else if (process.env.DATABASE_URL.startsWith('file:')) {
      envCheck.issues.push('DATABASE_URL is pointing to SQLite file (will not work in production)');
      envCheck.recommendations.push({
        type: 'critical',
        title: 'Wrong Database Type',
        steps: [
          '1. Go to Vercel Dashboard',
          '2. Select your project', 
          '3. Go to Settings → Environment Variables',
          '4. Update DATABASE_URL to use Supabase PostgreSQL',
          '5. Remove the SQLite file reference'
        ]
      });
    }

    if (!process.env.JWT_SECRET) {
      envCheck.issues.push('JWT_SECRET is not set');
      envCheck.recommendations.push({
        type: 'critical',
        title: 'Missing JWT_SECRET',
        steps: [
          '1. Go to Vercel Dashboard',
          '2. Select your project',
          '3. Go to Settings → Environment Variables', 
          '4. Add JWT_SECRET with a secure random string',
          '5. Generate one: openssl rand -base64 32'
        ]
      });
    } else if (process.env.JWT_SECRET.length < 16) {
      envCheck.issues.push('JWT_SECRET is too short (should be at least 16 characters)');
      envCheck.recommendations.push({
        type: 'warning',
        title: 'Weak JWT_SECRET',
        steps: [
          '1. Generate a stronger JWT_SECRET',
          '2. Use: openssl rand -base64 32',
          '3. Update in Vercel environment variables'
        ]
      });
    }

    // Check if environment looks good
    if (envCheck.issues.length === 0) {
      envCheck.recommendations.push({
        type: 'success',
        title: 'Environment Variables Look Good',
        steps: [
          '✅ DATABASE_URL is set and points to PostgreSQL',
          '✅ JWT_SECRET is set and has sufficient length',
          'Next: Check if Supabase database is active'
        ]
      });
    }

    console.log('✅ Environment check completed');
    return NextResponse.json(envCheck);

  } catch (error) {
    console.error('❌ Environment check failed:', error);
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