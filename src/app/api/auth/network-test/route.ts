import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Network Connectivity Test Started');
    
    const testResults = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_PREVIEW: process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'),
        DATABASE_HOST: process.env.DATABASE_URL?.match(/@([^:]+):/)?.[1] || 'Unknown'
      },
      tests: {
        prismaConnection: null,
        directConnection: null,
        connectionString: null
      },
      analysis: {
        possibleIssues: [],
        recommendations: []
      }
    };

    // Test 1: Prisma Connection with detailed error
    try {
      console.log('📡 Testing Prisma connection...');
      await prisma.$connect();
      testResults.tests.prismaConnection = { success: true, error: null };
      console.log('✅ Prisma connection successful');
    } catch (error) {
      testResults.tests.prismaConnection = { success: false, error: error.message };
      console.log('❌ Prisma connection failed:', error.message);
      
      // Analyze the error
      if (error.message.includes("Can't reach database server")) {
        testResults.analysis.possibleIssues.push('Network connectivity issue');
        testResults.analysis.recommendations.push({
          type: 'network',
          title: 'Network Connectivity Issue',
          steps: [
            '1. Check if Supabase database is actually running',
            '2. Verify the database host is correct',
            '3. Check if there are any firewall restrictions',
            '4. Try connecting from a different network'
          ]
        });
      }
      
      if (error.message.includes("authentication failed")) {
        testResults.analysis.possibleIssues.push('Authentication issue');
        testResults.analysis.recommendations.push({
          type: 'auth',
          title: 'Authentication Failed',
          steps: [
            '1. Check database password in connection string',
            '2. Verify Supabase credentials',
            '3. Check if database user exists and has permissions'
          ]
        });
      }
      
      if (error.message.includes("connection refused")) {
        testResults.analysis.possibleIssues.push('Port/connection refused');
        testResults.analysis.recommendations.push({
          type: 'port',
          title: 'Connection Refused',
          steps: [
            '1. Check if port 5432 is open',
            '2. Verify Supabase database is accepting connections',
            '3. Check if database is in maintenance mode'
          ]
        });
      }
      
      if (error.message.includes("timeout")) {
        testResults.analysis.possibleIssues.push('Connection timeout');
        testResults.analysis.recommendations.push({
          type: 'timeout',
          title: 'Connection Timeout',
          steps: [
            '1. Check network latency',
            '2. Verify database server is responsive',
            '3. Check if there are any proxy/firewall issues'
          ]
        });
      }
    }

    // Test 2: Connection String Analysis
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl) {
        const urlParts = new URL(dbUrl);
        testResults.tests.connectionString = {
          protocol: urlParts.protocol,
          hostname: urlParts.hostname,
          port: urlParts.port,
          database: urlParts.pathname.slice(1),
          username: urlParts.username,
          hasPassword: !!urlParts.password
        };
        
        console.log('✅ Connection string analysis completed');
      }
    } catch (error) {
      testResults.tests.connectionString = { error: error.message };
      console.log('❌ Connection string analysis failed:', error.message);
    }

    // Add general recommendations
    if (testResults.tests.prismaConnection?.success) {
      testResults.analysis.recommendations.push({
        type: 'success',
        title: 'Connection Working',
        steps: [
          '✅ Database connection successful',
          '✅ Network connectivity is good',
          'Ready for user registration!'
        ]
      });
    } else {
      testResults.analysis.recommendations.push({
        type: 'general',
        title: 'General Troubleshooting',
        steps: [
          '1. Check Supabase project status at https://status.supabase.com',
          '2. Verify your Supabase project is not in maintenance mode',
          '3. Check if your Supabase plan has connection limits',
          '4. Try connecting from Supabase dashboard SQL editor',
          '5. Contact Supabase support if issue persists'
        ]
      });
    }

    console.log('🔍 Network test completed');
    return NextResponse.json(testResults);

  } catch (error) {
    console.error('❌ Network test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Network test failed',
        debug: { error: error.message }
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 