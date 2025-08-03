# Blueprint: Task 1.2.5 - Set Up Seed Data for Testing

## Overview
This blueprint outlines the steps to set up seed data for the Trade-Tracker MVP application. The seed data will populate the database with sample trades and performance records for development and testing purposes.

## Prerequisites
- Completed Task 1.1.1 (Create Next.js 14 project with TypeScript and App Router)
- Completed Task 1.2.1 (Initialize Prisma with SQLite database)
- Completed Task 1.2.2 (Define database schema for Trade model)
- Completed Task 1.2.3 (Define database schema for Performance model)
- Completed Task 1.2.4 (Create initial database migration)
- Basic understanding of Prisma seeding

## Step-by-Step Instructions

### 1. Update the Seed Script

Update the `prisma/seed.ts` file to include seed data for both Trade and Performance models:

```typescript
import { PrismaClient } from '@prisma/client';

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
  
  // Create sample performance records
  const performances = [
    {
      period: 'weekly',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-07'),
      totalTrades: 2,
      winningTrades: 2,
      losingTrades: 0,
      profitLoss: 156.78,
      profitLossPercentage: 3.25,
      largestWin: 98.45,
      largestLoss: 0,
      averageWin: 78.39,
      averageLoss: 0,
      winRate: 100,
      spReturn: 1.45,
      outperformance: 1.8,
    },
    {
      period: 'weekly',
      startDate: new Date('2023-01-08'),
      endDate: new Date('2023-01-14'),
      totalTrades: 3,
      winningTrades: 2,
      losingTrades: 1,
      profitLoss: 87.32,
      profitLossPercentage: 1.82,
      largestWin: 76.21,
      largestLoss: -45.67,
      averageWin: 66.50,
      averageLoss: -45.67,
      winRate: 66.67,
      spReturn: 2.1,
      outperformance: -0.28,
    },
    {
      period: 'monthly',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-31'),
      totalTrades: 8,
      winningTrades: 5,
      losingTrades: 3,
      profitLoss: 345.67,
      profitLossPercentage: 4.32,
      largestWin: 120.45,
      largestLoss: -78.90,
      averageWin: 89.76,
      averageLoss: -56.78,
      winRate: 62.5,
      spReturn: 3.5,
      outperformance: 0.82,
    },
    {
      period: 'monthly',
      startDate: new Date('2023-02-01'),
      endDate: new Date('2023-02-28'),
      totalTrades: 6,
      winningTrades: 4,
      losingTrades: 2,
      profitLoss: 267.89,
      profitLossPercentage: 3.78,
      largestWin: 110.23,
      largestLoss: -65.43,
      averageWin: 83.45,
      averageLoss: -49.87,
      winRate: 66.67,
      spReturn: 2.8,
      outperformance: 0.98,
    },
    {
      period: 'yearly',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      totalTrades: 45,
      winningTrades: 28,
      losingTrades: 17,
      profitLoss: 3456.78,
      profitLossPercentage: 18.65,
      largestWin: 567.89,
      largestLoss: -234.56,
      averageWin: 178.45,
      averageLoss: -98.76,
      winRate: 62.22,
      spReturn: 15.23,
      outperformance: 3.42,
    },
  ];
  
  // Insert performance records
  for (const performance of performances) {
    await prisma.performance.create({
      data: performance,
    });
  }
  
  // Associate some trades with performance records
  // This is just an example - in a real application, you would associate trades with the correct performance periods
  const firstTrade = await prisma.trade.findFirst({ where: { ticker: 'AAPL' } });
  const weeklyPerformance = await prisma.performance.findFirst({ where: { period: 'weekly' } });
  
  if (firstTrade && weeklyPerformance) {
    await prisma.trade.update({
      where: { id: firstTrade.id },
      data: { performanceId: weeklyPerformance.id },
    });
  }
  
  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 2. Update package.json with Prisma Seed Script

Update the `package.json` file to include the Prisma seed script configuration:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

### 3. Install Required Dependencies

Install the necessary dependencies for running the seed script:

```bash
npm install --save-dev ts-node
```

### 4. Run the Seed Script

Run the seed script to populate the database:

```bash
npx prisma db seed
```

### 5. Verify the Seeded Data

Use Prisma Studio to verify that the seed data has been correctly inserted:

```bash
npx prisma studio
```

This will open a web interface at http://localhost:5555 where you can browse the database tables and records.

### 6. Create a Helper Script for Resetting the Database (Optional)

Create a helper script for easily resetting the database during development:

```typescript
// scripts/reset-db.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('Resetting database...');
  
  // Delete all records from all tables
  await prisma.trade.deleteMany();
  await prisma.performance.deleteMany();
  
  console.log('Database reset completed.');
}

resetDatabase()
  .catch((e) => {
    console.error('Error resetting database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add a script to package.json:

```json
{
  "scripts": {
    "reset-db": "ts-node --compiler-options {\"module\":\"CommonJS\"} scripts/reset-db.ts"
  }
}
```

### 7. Update the API Test Endpoint

Update the API test endpoint to include a count of the seeded data:

```typescript
// src/app/api/test-db/route.ts

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test database connection by querying the models
    const tradeCount = await prisma.trade.count();
    const performanceCount = await prisma.performance.count();
    
    // Get some sample data
    const recentTrades = await prisma.trade.findMany({
      take: 3,
      orderBy: { entryDate: 'desc' },
      select: { id: true, ticker: true, entryDate: true, exitDate: true }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        models: {
          trade: {
            count: tradeCount,
            recent: recentTrades
          },
          performance: {
            count: performanceCount
          }
        }
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
```

## Expected Outcome

- A populated database with sample trades and performance records
- A working seed script that can be run to reset and repopulate the database
- A test API endpoint that confirms the database connection and shows the seeded data

## Troubleshooting

If you encounter issues with the seeding process:

1. Check that the DATABASE_URL is correctly set in the .env file
2. Ensure that the prisma/schema.prisma file has valid syntax
3. Look for error messages in the console output
4. If needed, reset the database with `npx prisma migrate reset` (this will delete all data and reapply migrations)

## Next Steps

After completing this task, you can proceed to Task 1.3.3 (Set up OpenAI GPT-4o API integration), which will involve setting up the integration with the OpenAI API for AI-powered insights. 