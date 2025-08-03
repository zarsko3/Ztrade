import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/services/auth-service';

const prisma = new PrismaClient();

async function debugAuth() {
  try {
    console.log('🔍 Debugging Authentication System...\n');

    // 1. Check environment variables
    console.log('1. Environment Variables:');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not set'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`);

    // 2. Test database connection
    console.log('2. Database Connection:');
    try {
      await prisma.$connect();
      console.log('   ✅ Database connection successful');
    } catch (error) {
      console.log('   ❌ Database connection failed:', error);
      return;
    }

    // 3. Check if tables exist
    console.log('\n3. Database Tables:');
    try {
      const users = await prisma.user.findMany({ take: 1 });
      console.log('   ✅ Users table exists');
      console.log(`   📊 Total users: ${await prisma.user.count()}`);
    } catch (error) {
      console.log('   ❌ Users table error:', error);
    }

    try {
      const trades = await prisma.trade.findMany({ take: 1 });
      console.log('   ✅ Trades table exists');
      console.log(`   📊 Total trades: ${await prisma.trade.count()}`);
    } catch (error) {
      console.log('   ❌ Trades table error:', error);
    }

    // 4. Test user creation
    console.log('\n4. Test User Creation:');
    const testUser = {
      username: 'test_user_' + Date.now(),
      password: 'test123',
      email: 'test@example.com',
      name: 'Test User'
    };

    try {
      const result = await AuthService.register(testUser);
      if (result.success) {
        console.log('   ✅ User creation successful');
        console.log(`   👤 Created user: ${result.user?.username}`);
        
        // Test login
        const loginResult = await AuthService.login({
          username: testUser.username,
          password: testUser.password
        });
        
        if (loginResult.success) {
          console.log('   ✅ Login test successful');
        } else {
          console.log('   ❌ Login test failed:', loginResult.message);
        }

        // Clean up test user
        await prisma.user.delete({
          where: { username: testUser.username }
        });
        console.log('   🧹 Test user cleaned up');
      } else {
        console.log('   ❌ User creation failed:', result.message);
      }
    } catch (error) {
      console.log('   ❌ User creation error:', error);
    }

    // 5. Check existing users
    console.log('\n5. Existing Users:');
    try {
      const users = await prisma.user.findMany({
        select: { id: true, username: true, email: true, role: true, isActive: true }
      });
      
      if (users.length === 0) {
        console.log('   📝 No users found in database');
      } else {
        console.log(`   👥 Found ${users.length} users:`);
        users.forEach(user => {
          console.log(`      - ${user.username} (${user.role}) ${user.isActive ? '✅' : '❌'}`);
        });
      }
    } catch (error) {
      console.log('   ❌ Error fetching users:', error);
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuth(); 