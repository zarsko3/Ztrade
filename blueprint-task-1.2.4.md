# Blueprint: Task 1.2.4 - Create Initial Database Migration

## Overview
This blueprint outlines the steps to create the initial database migration for the Trade-Tracker MVP application. The migration will apply the schema definitions for the Trade and Performance models to the SQLite database.

## Prerequisites
- Completed Task 1.1.1 (Create Next.js 14 project with TypeScript and App Router)
- Completed Task 1.2.1 (Initialize Prisma with SQLite database)
- Completed Task 1.2.2 (Define database schema for Trade model)
- Completed Task 1.2.3 (Define database schema for Performance model)
- Basic understanding of Prisma migrations

## Step-by-Step Instructions

### 1. Update the Prisma Schema

First, ensure that the `prisma/schema.prisma` file contains all the necessary model definitions for both Trade and Performance models:

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// Trade model for storing stock trade information
model Trade {
  id          Int       @id @default(autoincrement())
  ticker      String    // Stock ticker symbol (e.g., AAPL, MSFT)
  entryDate   DateTime  // Date when the trade was entered
  entryPrice  Float     // Price per share at entry
  exitDate    DateTime? // Date when the trade was exited (null for open positions)
  exitPrice   Float?    // Price per share at exit (null for open positions)
  quantity    Int       // Number of shares
  fees        Float?    // Trading fees (optional)
  notes       String?   // Additional notes about the trade (optional)
  tags        String?   // Comma-separated tags for categorization (optional)
  isShort     Boolean   @default(false) // Whether this is a short position
  
  // Metadata
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relationship with Performance
  performance     Performance? @relation(fields: [performanceId], references: [id])
  performanceId   Int?
  
  // Indexes for improved query performance
  @@index([ticker])
  @@index([entryDate])
  @@index([exitDate])
  
  // Validation rules (to be implemented in application code):
  // - ticker: must be a valid stock symbol (uppercase, 1-5 characters)
  // - entryPrice: must be greater than 0
  // - exitPrice: must be greater than 0 when provided
  // - quantity: must be greater than 0
  // - exitDate: must be after entryDate when provided
}

// Performance model for storing aggregated performance metrics
model Performance {
  id              Int       @id @default(autoincrement())
  period          String    // "weekly", "monthly", or "yearly"
  startDate       DateTime  // Start date of the period
  endDate         DateTime  // End date of the period
  totalTrades     Int       // Total number of trades closed in this period
  winningTrades   Int       // Number of profitable trades
  losingTrades    Int       // Number of unprofitable trades
  profitLoss      Float     // Total profit/loss for the period
  profitLossPercentage Float // Percentage profit/loss for the period
  largestWin      Float     // Largest winning trade amount
  largestLoss     Float     // Largest losing trade amount
  averageWin      Float     // Average winning trade amount
  averageLoss     Float     // Average losing trade amount
  winRate         Float     // Win rate as a percentage (winningTrades / totalTrades * 100)
  spReturn        Float     // S&P 500 return for the same period (percentage)
  outperformance  Float     // Outperformance vs S&P 500 (profitLossPercentage - spReturn)
  
  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relationships
  trades          Trade[]   // Trades included in this performance period
  
  // Indexes for improved query performance
  @@index([period])
  @@index([startDate, endDate])
  @@unique([period, startDate, endDate]) // Ensure no duplicate periods
  
  // Validation rules (to be implemented in application code):
  // - period: must be one of "weekly", "monthly", or "yearly"
  // - endDate: must be after startDate
  // - totalTrades: must equal winningTrades + losingTrades
  // - winRate: must equal (winningTrades / totalTrades * 100)
}
```

### 2. Ensure the DATABASE_URL Environment Variable is Set

Create or update the `.env` file in the project root to include the DATABASE_URL:

```
DATABASE_URL="file:./dev.db"
```

### 3. Create the Initial Migration

Run the following command to create the initial migration:

```bash
npx prisma migrate dev --name init
```

This command will:
1. Generate SQL migration files in the `prisma/migrations` directory
2. Apply the migration to the database
3. Generate the Prisma client

### 4. Verify the Migration

After running the migration, verify that it was applied successfully:

```bash
npx prisma migrate status
```

This command will show the status of all migrations. The output should indicate that the migration has been applied.

### 5. Explore the Database (Optional)

You can use Prisma Studio to explore the database and verify that the tables have been created correctly:

```bash
npx prisma studio
```

This will open a web interface at http://localhost:5555 where you can browse the database tables and records.

### 6. Update the Prisma Client Instance

Ensure that the Prisma client instance is properly set up in the application. Create or update the `src/lib/prisma.ts` file:

```typescript
// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 7. Create a Test API Endpoint

Create a simple API endpoint to test the database connection. Create a new file at `src/app/api/test-db/route.ts`:

```typescript
// src/app/api/test-db/route.ts

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test database connection by querying the Trade model
    const tradeCount = await prisma.trade.count();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        models: {
          trade: {
            count: tradeCount
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

### 8. Test the API Endpoint

Start the development server and test the API endpoint:

```bash
npm run dev
```

Then navigate to http://localhost:3000/api/test-db in your browser or use a tool like curl or Postman to make a GET request to the endpoint.

## Expected Outcome

- A successful migration that creates the Trade and Performance tables in the SQLite database
- A working Prisma client that can interact with the database
- A test API endpoint that confirms the database connection is working correctly

## Troubleshooting

If you encounter issues with the migration:

1. Check that the DATABASE_URL is correctly set in the .env file
2. Ensure that the prisma/schema.prisma file has valid syntax
3. Look for error messages in the console output
4. If needed, reset the database with `npx prisma migrate reset` (this will delete all data)

## Next Steps

After completing this task, you can proceed to Task 1.2.5 (Set up seed data for testing), which will involve creating seed data to populate the database for development and testing purposes. 