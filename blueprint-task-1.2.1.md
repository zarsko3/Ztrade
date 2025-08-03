# Blueprint: Task 1.2.1 - Initialize Prisma with SQLite Database

## Overview
This blueprint outlines the steps to initialize Prisma ORM with a SQLite database for the Trade-Tracker MVP application. Prisma will be used to define the database schema, handle migrations, and provide a type-safe database client.

## Prerequisites
- Completed Task 1.1.1 (Create Next.js 14 project with TypeScript and App Router)
- Node.js (v18.17.0 or later)
- npm (v9.6.7 or later)

## Step-by-Step Instructions

### 1. Install Prisma as a development dependency

```bash
# Navigate to your project directory if not already there
cd trade-tracker

# Install Prisma CLI and dependencies
npm install prisma --save-dev

# Install Prisma Client
npm install @prisma/client
```

### 2. Initialize Prisma in your project

```bash
# Initialize Prisma with SQLite provider
npx prisma init --datasource-provider sqlite
```

This command will:
- Create a `prisma` directory at the root of your project
- Create a `prisma/schema.prisma` file with a basic configuration
- Create a `.env` file with a `DATABASE_URL` environment variable

### 3. Configure the Prisma schema for SQLite

Update the `prisma/schema.prisma` file with the following content:

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

// Models will be added in subsequent tasks
```

### 4. Update the `.env` file to set the database URL

```
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for SQLite, MySQL, PostgreSQL, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="file:./dev.db"
```

### 5. Create a Prisma Client instance for use throughout the application

Create a new file at `src/lib/prisma.ts` with the following content:

```typescript
import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 6. Create a simple database seed script

Create a new file at `prisma/seed.ts` with the following content:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Example seed data will be added in subsequent tasks
  
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

### 7. Add the seed script to `package.json`

Update the `package.json` file to include the Prisma seed command:

```json
{
  "name": "trade-tracker",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:studio": "prisma studio",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  },
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  },
  // ... rest of your package.json
}
```

### 8. Install ts-node for running the seed script

```bash
npm install --save-dev ts-node
```

### 9. Create a simple API route to test Prisma connection

Create a new file at `src/app/api/test-db/route.ts` with the following content:

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Simple query to test database connection
    const databaseExists = await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Database connection successful',
      data: databaseExists 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to connect to database',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
```

### 10. Generate Prisma Client

```bash
npx prisma generate
```

This command generates the Prisma Client based on your schema, which will be used to interact with your database.

### 11. Test the database connection

Start your development server:

```bash
npm run dev
```

Visit `http://localhost:3000/api/test-db` in your browser to test the database connection. You should see a JSON response indicating a successful connection.

### 12. Set up Prisma Studio for database visualization

Prisma Studio is a visual editor for your database. You can start it with:

```bash
npx prisma studio
```

This will open Prisma Studio in your browser at `http://localhost:5555`.

### 13. Commit your changes

```bash
git add .
git commit -m "Initialize Prisma with SQLite database"
```

## Expected Project Structure

After completing this task, your project structure should include the following new files:

```
trade-tracker/
├── .env                  # Updated with DATABASE_URL
├── package.json          # Updated with Prisma scripts
├── prisma/
│   ├── schema.prisma     # Prisma schema file
│   └── seed.ts           # Database seed script
├── src/
│   ├── app/
│   │   └── api/
│   │       └── test-db/
│   │           └── route.ts  # API route to test DB connection
│   └── lib/
│       └── prisma.ts     # Prisma client instance
└── ... (existing files)
```

## Next Steps

After completing this task, you should proceed to:
- Task 1.2.2: Define database schema for Trade model
- Task 1.2.3: Define database schema for Performance model 