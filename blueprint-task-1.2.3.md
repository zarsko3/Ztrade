# Blueprint: Task 1.2.3 - Define Database Schema for Performance Model

## Overview
This blueprint outlines the steps to define the database schema for the Performance model in the Trade-Tracker MVP application. The Performance model will store aggregated performance metrics for different time periods (weekly, monthly, yearly), allowing for efficient retrieval of performance data without recalculating it for each request.

## Prerequisites
- Completed Task 1.1.1 (Create Next.js 14 project with TypeScript and App Router)
- Completed Task 1.2.1 (Initialize Prisma with SQLite database)
- Completed Task 1.2.2 (Define database schema for Trade model)
- Basic understanding of Prisma schema definition

## Step-by-Step Instructions

### 1. Define the Performance Model Schema

Update the `prisma/schema.prisma` file to include the Performance model with the following fields:

```prisma
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
}
```

### 2. Update the Trade Model with Relationship

Update the Trade model to include a relationship with the Performance model:

```prisma
// Update the Trade model to include the relationship
model Trade {
  // ... existing fields
  
  // Relationship with Performance
  performance     Performance? @relation(fields: [performanceId], references: [id])
  performanceId   Int?
}
```

### 3. Add Indexes for Improved Query Performance

Add appropriate indexes to the Performance model for fields that will be frequently queried:

```prisma
// Add to the Performance model
model Performance {
  // ... existing fields
  
  // Indexes for improved query performance
  @@index([period])
  @@index([startDate, endDate])
  @@unique([period, startDate, endDate]) // Ensure no duplicate periods
}
```

### 4. Add Validation Rules (Comments)

Add comments to document validation rules that will be implemented in the application layer:

```prisma
// Add as comments in the Performance model
model Performance {
  // ... existing fields
  
  // Validation rules (to be implemented in application code):
  // - period: must be one of "weekly", "monthly", or "yearly"
  // - endDate: must be after startDate
  // - totalTrades: must equal winningTrades + losingTrades
  // - winRate: must equal (winningTrades / totalTrades * 100)
}
```

### 5. Generate Prisma Client

After updating the schema, generate the Prisma client to reflect the changes:

```bash
npx prisma generate
```

### 6. Create a Migration

Create a migration to apply the schema changes to the database:

```bash
npx prisma migrate dev --name add_performance_model
```

### 7. Create a Type Definition File

Create a `types/performance.ts` file to define TypeScript interfaces for the Performance model:

```typescript
// src/types/performance.ts

import { Trade } from './trade';

export type PeriodType = 'weekly' | 'monthly' | 'yearly';

export interface Performance {
  id: number;
  period: PeriodType;
  startDate: Date;
  endDate: Date;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitLoss: number;
  profitLossPercentage: number;
  largestWin: number;
  largestLoss: number;
  averageWin: number;
  averageLoss: number;
  winRate: number;
  spReturn: number;
  outperformance: number;
  createdAt: Date;
  updatedAt: Date;
  trades?: Trade[];
}

export interface PerformanceCreateInput {
  period: PeriodType;
  startDate: Date;
  endDate: Date;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitLoss: number;
  profitLossPercentage: number;
  largestWin: number;
  largestLoss: number;
  averageWin: number;
  averageLoss: number;
  winRate: number;
  spReturn: number;
  outperformance: number;
  trades?: { connect: { id: number }[] };
}

export interface PerformanceUpdateInput {
  period?: PeriodType;
  startDate?: Date;
  endDate?: Date;
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  profitLoss?: number;
  profitLossPercentage?: number;
  largestWin?: number;
  largestLoss?: number;
  averageWin?: number;
  averageLoss?: number;
  winRate?: number;
  spReturn?: number;
  outperformance?: number;
  trades?: { connect: { id: number }[] } | { disconnect: { id: number }[] };
}
```

### 8. Create a Performance Service

Create a `services/performance-service.ts` file to handle Performance model operations:

```typescript
// src/services/performance-service.ts

import { prisma } from '@/lib/prisma';
import { Performance, PerformanceCreateInput, PeriodType } from '@/types/performance';
import { Trade } from '@/types/trade';

export class PerformanceService {
  /**
   * Calculate performance metrics for a set of trades
   */
  static calculatePerformanceMetrics(
    trades: Trade[],
    period: PeriodType,
    startDate: Date,
    endDate: Date,
    spReturn: number
  ): Omit<PerformanceCreateInput, 'period' | 'startDate' | 'endDate' | 'spReturn'> {
    // Filter out trades that don't have an exit date or price
    const closedTrades = trades.filter(trade => trade.exitDate && trade.exitPrice);
    
    // Calculate total trades
    const totalTrades = closedTrades.length;
    
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        profitLoss: 0,
        profitLossPercentage: 0,
        largestWin: 0,
        largestLoss: 0,
        averageWin: 0,
        averageLoss: 0,
        winRate: 0,
        outperformance: -spReturn, // If no trades, outperformance is negative of S&P return
      };
    }
    
    // Calculate profit/loss for each trade
    const tradesWithPL = closedTrades.map(trade => {
      const entryValue = trade.entryPrice * trade.quantity;
      const exitValue = (trade.exitPrice as number) * trade.quantity;
      const profitLoss = trade.isShort 
        ? entryValue - exitValue 
        : exitValue - entryValue;
      
      return {
        ...trade,
        profitLoss,
        profitLossPercentage: (profitLoss / entryValue) * 100,
      };
    });
    
    // Separate winning and losing trades
    const winningTrades = tradesWithPL.filter(trade => trade.profitLoss > 0);
    const losingTrades = tradesWithPL.filter(trade => trade.profitLoss <= 0);
    
    // Calculate metrics
    const totalProfitLoss = tradesWithPL.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const totalInvestment = tradesWithPL.reduce((sum, trade) => sum + (trade.entryPrice * trade.quantity), 0);
    const profitLossPercentage = (totalProfitLoss / totalInvestment) * 100;
    
    const largestWin = winningTrades.length > 0
      ? Math.max(...winningTrades.map(trade => trade.profitLoss))
      : 0;
      
    const largestLoss = losingTrades.length > 0
      ? Math.min(...losingTrades.map(trade => trade.profitLoss))
      : 0;
      
    const averageWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, trade) => sum + trade.profitLoss, 0) / winningTrades.length
      : 0;
      
    const averageLoss = losingTrades.length > 0
      ? losingTrades.reduce((sum, trade) => sum + trade.profitLoss, 0) / losingTrades.length
      : 0;
      
    const winRate = (winningTrades.length / totalTrades) * 100;
    
    const outperformance = profitLossPercentage - spReturn;
    
    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      profitLoss: totalProfitLoss,
      profitLossPercentage,
      largestWin,
      largestLoss,
      averageWin,
      averageLoss,
      winRate,
      outperformance,
      trades: { connect: closedTrades.map(trade => ({ id: trade.id })) },
    };
  }
}
```

## Expected Outcome
- A well-defined Prisma schema for the Performance model
- Relationship between the Trade and Performance models
- TypeScript interfaces for type safety
- A service for calculating performance metrics
- Migrations to apply the schema changes to the database

## Notes
- The Performance model is designed to store pre-calculated metrics to improve query performance
- The relationship between Trade and Performance models allows for easy retrieval of trades within a performance period
- Calculated fields are stored in the database to avoid recalculating them for each request
- Indexes are added for fields that will be frequently queried to improve performance
- Validation rules are documented as comments and will be implemented in the application code 