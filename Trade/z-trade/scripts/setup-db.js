const { PrismaClient } = require('@prisma/client');

async function setupDatabase() {
  console.log('🔍 Setting up database...');
  
  // This will use the DATABASE_URL from Vercel environment variables
  const prisma = new PrismaClient();
  
  try {
    // Test connection
    console.log('✅ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Push schema to database
    console.log('✅ Pushing schema to database...');
    const { execSync } = require('child_process');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    console.log('✅ Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase(); 