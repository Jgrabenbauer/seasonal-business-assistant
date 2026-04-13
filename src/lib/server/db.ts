import { PrismaClient } from '@prisma/client';
import { env } from '$lib/server/env';
import { createPrismaClient } from '$lib/server/prisma-client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? createPrismaClient(env.DATABASE_URL, {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
