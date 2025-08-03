const { PrismaClient } = require('@prisma/client');

async function diagnoseDatabase() {
  console.log('🔍 Database Diagnostic Tool\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
  
  if (process.env.DATABASE_URL) {
    const isSQLite = process.env.DATABASE_URL.startsWith('file:');
    const isPostgreSQL = process.env.DATABASE_URL.startsWith('postgresql:');
    
    console.log('\n🔍 Database Type Analysis:');
    console.log('Is SQLite:', isSQLite);
    console.log('Is PostgreSQL:', isPostgreSQL);
    console.log('Connection String Preview:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@'));
  }
  
  console.log('\n📡 Testing Database Connection...');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test schema
    try {
      const userCount = await prisma.user.count();
      console.log(`📊 Users table accessible: ${userCount} users found`);
    } catch (error) {
      console.log('❌ Users table not accessible:', error.message);
    }
    
    try {
      const tradeCount = await prisma.trade.count();
      console.log(`📊 Trades table accessible: ${tradeCount} trades found`);
    } catch (error) {
      console.log('❌ Trades table not accessible:', error.message);
    }
    
    // Test schema generation
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `;
      console.log('📋 Available tables:', tables.map(t => t.table_name).join(', '));
    } catch (error) {
      console.log('⚠️ Could not list tables (might be SQLite):', error.message);
    }
    
  } catch (error) {
    console.log('❌ Database connection failed!');
    console.log('Error:', error.message);
    
    console.log('\n🔧 Troubleshooting Recommendations:');
    
    if (error.message.includes("Can't reach database server")) {
      console.log('🌐 Network/Server Issue:');
      console.log('1. Check if Supabase database is active:');
      console.log('   - Go to https://supabase.com/dashboard');
      console.log('   - Select your project');
      console.log('   - Go to Database → Settings');
      console.log('   - Resume database if paused');
      
      console.log('\n2. Verify connection string in Vercel:');
      console.log('   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
      console.log('   - Check DATABASE_URL format');
      console.log('   - Should be: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres');
    }
    
    if (error.message.includes("Error validating datasource")) {
      console.log('⚙️ Schema Configuration Issue:');
      console.log('1. Check Prisma schema configuration');
      console.log('2. Ensure provider matches database type');
      console.log('3. Run: npx prisma generate');
    }
    
    if (error.message.includes("authentication failed")) {
      console.log('🔐 Authentication Issue:');
      console.log('1. Check database password in connection string');
      console.log('2. Verify Supabase credentials');
    }
    
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. If local works but production fails: Check Vercel environment variables');
  console.log('2. If both fail: Check Supabase database status');
  console.log('3. If schema issues: Run "npx prisma generate" and redeploy');
}

diagnoseDatabase(); 