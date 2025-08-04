import { prisma } from '../src/lib/prisma';

async function testUserSync() {
  try {
    console.log('Testing user sync...');
    
    // Check if any users exist
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users in database:`, users);
    
    // Check if any trades exist
    const trades = await prisma.trade.findMany();
    console.log(`Found ${trades.length} trades in database:`, trades);
    
    // Test creating a sample user (for testing purposes)
    const testUserId = 'test-user-' + Date.now();
    const testUser = await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        isActive: true,
        role: 'user'
      }
    });
    
    console.log('Created test user:', testUser);
    
    // Test creating a sample trade
    const testTrade = await prisma.trade.create({
      data: {
        ticker: 'AAPL',
        entryDate: new Date(),
        entryPrice: 150.00,
        quantity: 10,
        userId: testUserId,
        isShort: false
      }
    });
    
    console.log('Created test trade:', testTrade);
    
    // Clean up test data
    await prisma.trade.delete({ where: { id: testTrade.id } });
    await prisma.user.delete({ where: { id: testUserId } });
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserSync(); 