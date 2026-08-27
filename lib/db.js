import { PrismaClient } from '@prisma/client';

const globalForDb = globalThis;

export const db =
  globalForDb.db ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.WORKFLOW_DATABASE_URL || 'file:./dev.db',
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

export default db;
