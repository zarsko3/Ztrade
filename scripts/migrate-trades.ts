import { prisma } from '../src/lib/prisma';

async function migrateTrades() {
  try {
    console.log('Starting trade migration...');
    
    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.id}: ${user.email} (${user.username})`);
    });
    
    // Get all trades
    const trades = await prisma.trade.findMany();
    console.log(`\nFound ${trades.length} trades:`);
    trades.forEach(trade => {
      console.log(`- ${trade.id}: ${trade.ticker} (userId: ${trade.userId})`);
    });
    
    // Find trades with default-user-id
    const defaultTrades = trades.filter(trade => trade.userId === 'default-user-id');
    console.log(`\nFound ${defaultTrades.length} trades with default-user-id`);
    
    if (defaultTrades.length === 0) {
      console.log('No trades to migrate.');
      return;
    }
    
    // Get the first real user (not default)
    const realUser = users.find(user => user.id !== 'default-user-id');
    if (!realUser) {
      console.log('No real users found to migrate trades to.');
      return;
    }
    
    console.log(`\nMigrating trades to user: ${realUser.id} (${realUser.email})`);
    
    // Update all default trades to the real user
    const updatePromises = defaultTrades.map(trade => 
      prisma.trade.update({
        where: { id: trade.id },
        data: { userId: realUser.id }
      })
    );
    
    await Promise.all(updatePromises);
    
    console.log(`Successfully migrated ${defaultTrades.length} trades to user ${realUser.id}`);
    
    // Verify the migration
    const updatedTrades = await prisma.trade.findMany({
      where: { userId: realUser.id }
    });
    console.log(`\nUser ${realUser.id} now has ${updatedTrades.length} trades`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateTrades(); 