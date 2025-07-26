import { PrismaClient } from '@prisma/client';
import { mockDb } from './mock-db';

// Check if we should use the mock database
const useMockDb = process.env.USE_MOCK_DB === 'true';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

let prismaInstance: PrismaClient | typeof mockDb;

if (useMockDb) {
  console.log('Using mock database for development');
  // Initialize mock database with seed data
  mockDb.seed();
  prismaInstance = mockDb;
} else {
  try {
    const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };
    prismaInstance = globalForPrisma.prisma || new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }
  } catch (error) {
    console.warn('Failed to initialize Prisma client, falling back to mock database:', error);
    mockDb.seed();
    prismaInstance = mockDb;
  }
}

export const prisma = prismaInstance; 