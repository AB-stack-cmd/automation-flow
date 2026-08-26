import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.WORKFLOW_DATABASE_URL || 'file:./dev.db'
    }
  }
});

// Configure SQLite WAL mode and busy timeout on startup to prevent SQLite database lock timeouts
async function configureDatabase() {
  try {
    await prisma.$executeRawUnsafe(`PRAGMA journal_mode=WAL;`);
    await prisma.$executeRawUnsafe(`PRAGMA busy_timeout=10000;`);
  } catch (err) {
    // PRAGMAs can be safely ignored if DB isn't initialized yet
  }
}

configureDatabase();
