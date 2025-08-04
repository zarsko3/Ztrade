import { prisma } from '../src/lib/prisma';
import { tradeService } from '../src/services/trade-service';

async function testTradesAPI() {
  try {
    console.log('Testing trades API...');
    
    // Test 1: Check if we can connect to the database
    console.log('\n1. Testing database connection...');
    const userCount = await prisma.user.count();
    console.log(`Database connection successful. Found ${userCount} users.`);
    
    // Test 2: Check if we can query trades directly
    console.log('\n2. Testing direct trade query...');
    const trades = await prisma.trade.findMany({
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });
    console.log(`Found ${trades.length} trades directly from database:`, trades.map(t => ({ id: t.id, ticker: t.ticker, userId: t.userId })));
    
    // Test 3: Test the trade service
    console.log('\n3. Testing trade service...');
    const testUserId = 'cmdtyog2e00008rucg737w755'; // Your user ID from the migration
    
    const result = await tradeService.getTrades({
      page: 1,
      limit: 10,
      sortBy: 'entryDate',
      sortOrder: 'desc',
      userId: testUserId
    });
    
    console.log('Trade service result:', {
      tradesCount: result.trades.length,
      pagination: result.pagination,
      firstTrade: result.trades[0] ? {
        id: result.trades[0].id,
        ticker: result.trades[0].ticker,
        userId: result.trades[0].userId
      } : null
    });
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // More detailed error information
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testTradesAPI(); 