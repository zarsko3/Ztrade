const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clear existing data
  await prisma.trade.deleteMany();
  await prisma.performance.deleteMany();
  
  // Create sample trades
  const trades = [
    {
      ticker: 'AAPL',
      entryDate: new Date('2023-01-15'),
      entryPrice: 135.83,
      exitDate: new Date('2023-02-10'),
      exitPrice: 151.73,
      quantity: 10,
      fees: 9.99,
      notes: 'Bought after earnings dip, sold after recovery',
      tags: 'earnings,tech,long-term',
      isShort: false,
    },
    {
      ticker: 'MSFT',
      entryDate: new Date('2023-02-01'),
      entryPrice: 247.81,
      exitDate: new Date('2023-03-15'),
      exitPrice: 265.44,
      quantity: 5,
      fees: 9.99,
      notes: 'Technical breakout play',
      tags: 'tech,breakout',
      isShort: false,
    },
    {
      ticker: 'TSLA',
      entryDate: new Date('2023-03-10'),
      entryPrice: 172.92,
      exitDate: new Date('2023-04-05'),
      exitPrice: 185.06,
      quantity: 8,
      fees: 9.99,
      notes: 'Swing trade based on technical support',
      tags: 'ev,tech,swing',
      isShort: false,
    },
    {
      ticker: 'AMZN',
      entryDate: new Date('2023-04-20'),
      entryPrice: 106.96,
      exitDate: new Date('2023-05-15'),
      exitPrice: 113.40,
      quantity: 12,
      fees: 9.99,
      notes: 'Post-earnings momentum play',
      tags: 'tech,earnings,momentum',
      isShort: false,
    },
    {
      ticker: 'NFLX',
      entryDate: new Date('2023-05-25'),
      entryPrice: 355.73,
      exitDate: new Date('2023-06-10'),
      exitPrice: 345.48,
      quantity: 3,
      fees: 9.99,
      notes: 'Attempted breakout that failed',
      tags: 'tech,streaming,failed',
      isShort: false,
    },
    {
      ticker: 'GOOGL',
      entryDate: new Date('2023-06-15'),
      entryPrice: 122.76,
      exitDate: new Date('2023-07-01'),
      exitPrice: 133.74,
      quantity: 10,
      fees: 9.99,
      notes: 'AI announcement catalyst',
      tags: 'tech,ai,catalyst',
      isShort: false,
    },
    {
      ticker: 'META',
      entryDate: new Date('2023-07-10'),
      entryPrice: 290.53,
      exitDate: new Date('2023-08-05'),
      exitPrice: 312.04,
      quantity: 5,
      fees: 9.99,
      notes: 'Earnings beat and positive guidance',
      tags: 'tech,social,earnings',
      isShort: false,
    },
    {
      ticker: 'NVDA',
      entryDate: new Date('2023-08-15'),
      entryPrice: 432.99,
      exitDate: new Date('2023-09-10'),
      exitPrice: 485.09,
      quantity: 3,
      fees: 9.99,
      notes: 'AI chip demand surge',
      tags: 'tech,ai,semiconductor',
      isShort: false,
    },
    {
      ticker: 'AMD',
      entryDate: new Date('2023-09-20'),
      entryPrice: 96.43,
      exitDate: new Date('2023-10-15'),
      exitPrice: 110.21,
      quantity: 15,
      fees: 9.99,
      notes: 'New product launch momentum',
      tags: 'tech,semiconductor,product-launch',
      isShort: false,
    },
    {
      ticker: 'JPM',
      entryDate: new Date('2023-10-25'),
      entryPrice: 142.95,
      exitDate: new Date('2023-11-20'),
      exitPrice: 153.01,
      quantity: 8,
      fees: 9.99,
      notes: 'Banking sector recovery play',
      tags: 'finance,banking,recovery',
      isShort: false,
    },
    {
      ticker: 'SHOP',
      entryDate: new Date('2023-11-25'),
      entryPrice: 72.98,
      exitDate: null, // Open position
      exitPrice: null,
      quantity: 20,
      fees: 9.99,
      notes: 'Long-term e-commerce growth play',
      tags: 'tech,e-commerce,long-term',
      isShort: false,
    },
    {
      ticker: 'DIS',
      entryDate: new Date('2023-12-10'),
      entryPrice: 92.69,
      exitDate: null, // Open position
      exitPrice: null,
      quantity: 12,
      fees: 9.99,
      notes: 'Turnaround play with new CEO',
      tags: 'entertainment,streaming,turnaround',
      isShort: false,
    },
  ];
  
  // Insert trades
  for (const trade of trades) {
    await prisma.trade.create({
      data: trade,
    });
  }
  
  console.log('Database seeded successfully!');
  console.log(`Created ${trades.length} sample trades`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 