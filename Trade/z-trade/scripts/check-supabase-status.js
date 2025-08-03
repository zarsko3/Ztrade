const { PrismaClient } = require('@prisma/client');

async function checkSupabaseStatus() {
  console.log('🔍 Checking Supabase database connectivity...\n');
  
  const prisma = new PrismaClient();
  
  try {
    console.log('📡 Attempting to connect to Supabase...');
    console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'));
    
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test basic operations
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
    const tradeCount = await prisma.trade.count();
    console.log(`📊 Trades in database: ${tradeCount}`);
    
    console.log('\n🎉 Everything is working correctly!');
    
  } catch (error) {
    console.log('❌ Database connection failed!');
    console.log('Error:', error.message);
    
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Check if your Supabase database is active:');
    console.log('   - Go to https://supabase.com/dashboard');
    console.log('   - Select your project');
    console.log('   - Go to Database → Settings');
    console.log('   - Check if database is paused (free tier auto-pauses)');
    console.log('   - If paused, click "Resume" to wake it up');
    
    console.log('\n2. Verify your connection string:');
    console.log('   - Format should be: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres');
    console.log('   - Check your Vercel environment variables');
    
    console.log('\n3. Check network connectivity:');
    console.log('   - Try: ping db.khfzxzkpdxxsxhbmntel.supabase.co');
    console.log('   - Check if port 5432 is accessible');
    
    console.log('\n4. Alternative: Use Supabase Dashboard');
    console.log('   - Go to https://supabase.com/dashboard');
    console.log('   - Select your project');
    console.log('   - Go to SQL Editor');
    console.log('   - Run: SELECT COUNT(*) FROM "User";');
    
  } finally {
    await prisma.$disconnect();
  }
}

checkSupabaseStatus(); 