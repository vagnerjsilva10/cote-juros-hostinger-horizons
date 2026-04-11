import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export class PrismaConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PrismaConfigError';
  }
}

const hasDatabaseUrl = () => Boolean(process.env.DATABASE_URL);

export const getPrisma = () => {
  if (!hasDatabaseUrl()) {
    throw new PrismaConfigError('DATABASE_URL is not configured');
  }

  if (!globalForPrisma.__prisma__) {
    globalForPrisma.__prisma__ = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    });
  }

  return globalForPrisma.__prisma__;
};
