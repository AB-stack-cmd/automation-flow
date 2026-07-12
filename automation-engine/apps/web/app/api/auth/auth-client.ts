import { betterAuth } from 'better-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: {
    db: prisma,
    type: 'sqlite',
  },
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET || "fallback_auth_secret_key_neuron_flow_12345",
});
