# Blueprint: Task 1.2.2 - Define Database Schema for Trade Model

## Overview
This blueprint outlines the steps to define the database schema for the Trade model in the Trade-Tracker MVP application. The Trade model will store information about stock trades, including ticker symbol, entry/exit dates and prices, quantity, and additional metadata.

## Prerequisites
- Completed Task 1.1.1 (Create Next.js 14 project with TypeScript and App Router)
- Completed Task 1.2.1 (Initialize Prisma with SQLite database)
- Basic understanding of Prisma schema definition

## Step-by-Step Instructions

### 1. Define the Trade Model Schema

Update the `prisma/schema.prisma` file to include the Trade model with the following fields:

```prisma
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
  
  // Calculated fields that will be computed in the application
  // These are not stored in the database but are included here for reference
  // profitLoss: calculated as (exitPrice - entryPrice) * quantity for long positions
  //             or (entryPrice - exitPrice) * quantity for short positions
  // profitLossPercentage: calculated as profitLoss / (entryPrice * quantity) * 100
  // duration: calculated as the difference between exitDate and entryDate
  
  // Metadata
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relationships (to be added in future tasks)
  // performance   Performance? @relation(fields: [performanceId], references: [id])
  // performanceId Int?
}
```

### 2. Add Indexes for Improved Query Performance

Add appropriate indexes to the Trade model for fields that will be frequently queried:

```prisma
// Add to the Trade model
model Trade {
  // ... existing fields
  
  // Indexes for improved query performance
  @@index([ticker])
  @@index([entryDate])
  @@index([exitDate])
}
```

### 3. Add Validation Rules (Comments)

Add comments to document validation rules that will be implemented in the application layer:

```prisma
// Add as comments in the Trade model
model Trade {
  // ... existing fields
  
  // Validation rules (to be implemented in application code):
  // - ticker: must be a valid stock symbol (uppercase, 1-5 characters)
  // - entryPrice: must be greater than 0
  // - exitPrice: must be greater than 0 when provided
  // - quantity: must be greater than 0
  // - exitDate: must be after entryDate when provided
}
```

### 4. Generate Prisma Client

After updating the schema, generate the Prisma client to reflect the changes:

```bash
npx prisma generate
```

### 5. Create a Migration

Create a migration to apply the schema changes to the database:

```bash
npx prisma migrate dev --name add_trade_model
```

### 6. Create a Type Definition File

Create a `types/trade.ts` file to define TypeScript interfaces for the Trade model:

```typescript
// src/types/trade.ts

export interface Trade {
  id: number;
  ticker: string;
  entryDate: Date;
  entryPrice: number;
  exitDate?: Date | null;
  exitPrice?: number | null;
  quantity: number;
  fees?: number | null;
  notes?: string | null;
  tags?: string | null;
  isShort: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeCreateInput {
  ticker: string;
  entryDate: Date;
  entryPrice: number;
  exitDate?: Date | null;
  exitPrice?: number | null;
  quantity: number;
  fees?: number | null;
  notes?: string | null;
  tags?: string | null;
  isShort?: boolean;
}

export interface TradeUpdateInput {
  ticker?: string;
  entryDate?: Date;
  entryPrice?: number;
  exitDate?: Date | null;
  exitPrice?: number | null;
  quantity?: number;
  fees?: number | null;
  notes?: string | null;
  tags?: string | null;
  isShort?: boolean;
}

// Additional interfaces for calculated fields
export interface TradeWithCalculatedFields extends Trade {
  profitLoss: number | null;
  profitLossPercentage: number | null;
  duration: number | null; // Duration in days
}
```

### 7. Create a Trade Service

Create a `services/trade-service.ts` file to handle Trade model operations:

```typescript
// src/services/trade-service.ts

import { prisma } from '@/lib/prisma';
import { Trade, TradeCreateInput, TradeUpdateInput, TradeWithCalculatedFields } from '@/types/trade';

export class TradeService {
  /**
   * Calculate profit/loss and other derived fields for a trade
   */
  static calculateDerivedFields(trade: Trade): TradeWithCalculatedFields {
    let profitLoss: number | null = null;
    let profitLossPercentage: number | null = null;
    let duration: number | null = null;
    
    // Calculate profit/loss if the trade has been exited
    if (trade.exitDate && trade.exitPrice) {
      if (trade.isShort) {
        // For short positions, profit is when exit price is lower than entry price
        profitLoss = (trade.entryPrice - trade.exitPrice) * trade.quantity;
      } else {
        // For long positions, profit is when exit price is higher than entry price
        profitLoss = (trade.exitPrice - trade.entryPrice) * trade.quantity;
      }
      
      // Subtract fees if present
      if (trade.fees) {
        profitLoss -= trade.fees;
      }
      
      // Calculate percentage
      const investment = trade.entryPrice * trade.quantity;
      profitLossPercentage = (profitLoss / investment) * 100;
      
      // Calculate duration in days
      duration = Math.floor((trade.exitDate.getTime() - trade.entryDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    return {
      ...trade,
      profitLoss,
      profitLossPercentage,
      duration,
    };
  }
}
```

## Expected Outcome
- A well-defined Prisma schema for the Trade model
- TypeScript interfaces for type safety
- A service for handling Trade model operations
- Migrations to apply the schema changes to the database

## Notes
- The schema is designed to be flexible enough to handle both long and short positions
- Calculated fields like profit/loss are not stored in the database but are computed at runtime
- Indexes are added for fields that will be frequently queried to improve performance
- Validation rules are documented as comments and will be implemented in the application code 