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