import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;
let connectionString = process.env.DATABASE_URL || "";

// Append sslmode=verify-full if missing to suppress pg-connection-string SSL deprecation warnings
if (connectionString && !connectionString.includes("sslmode=")) {
  connectionString += connectionString.includes("?") ? "&sslmode=verify-full" : "?sslmode=verify-full";
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
