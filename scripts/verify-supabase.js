const { PrismaClient } = require('@prisma/client');

async function verifySupabase() {
  console.log('🔍 Supabase Connection Verification\n');
  
  const prisma = new PrismaClient();
  
  try {
    console.log('📋 Current Configuration:');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    if (process.env.DATABASE_URL) {
      const urlParts = new URL(process.env.DATABASE_URL);
      console.log('Host:', urlParts.hostname);
      console.log('Port:', urlParts.port);
      console.log('Database:', urlParts.pathname.slice(1));
      console.log('Username:', urlParts.username);
    }
    
    console.log('\n📡 Testing Connection...');
    await prisma.$connect();
    console.log('✅ Connection successful!');
    
    // Test basic operations
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
    console.log('\n🎉 Supabase is working correctly!');
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Check Supabase Project Status:');
    console.log('   - Go to https://status.supabase.com');
    console.log('   - Check if there are any ongoing issues');
    
    console.log('\n2. Verify Your Supabase Project:');
    console.log('   - Go to https://supabase.com/dashboard');
    console.log('   - Select your project');
    console.log('   - Check if project is active (not suspended)');
    console.log('   - Go to Settings → General → Check project status');
    
    console.log('\n3. Test Connection from Supabase Dashboard:');
    console.log('   - Go to SQL Editor in your Supabase dashboard');
    console.log('   - Run: SELECT NOW();');
    console.log('   - If this works, the issue is with your connection string');
    
    console.log('\n4. Check Connection String:');
    console.log('   - Verify the password is correct');
    console.log('   - Check if there are any special characters in password');
    console.log('   - Try regenerating the connection string from Supabase');
    
    console.log('\n5. Check Vercel Environment:');
    console.log('   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
    console.log('   - Verify DATABASE_URL is set for Production environment');
    console.log('   - Check if there are any extra spaces or characters');
    
    console.log('\n6. Alternative: Try Direct Connection');
    console.log('   - Install PostgreSQL client: npm install pg');
    console.log('   - Test connection directly without Prisma');
    
    console.log('\n7. Check Supabase Plan Limits:');
    console.log('   - Free tier has connection limits');
    console.log('   - Check if you\'ve exceeded any limits');
    console.log('   - Go to Settings → Usage to check limits');
    
  } finally {
    await prisma.$disconnect();
  }
}

verifySupabase(); 