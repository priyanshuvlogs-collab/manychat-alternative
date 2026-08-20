import { PrismaClient } from './generated/client';

export * from './generated/client';

/**
 * Singleton PrismaClient.
 *
 * In development, hot-reload would otherwise create a new client (and a new
 * connection pool) on every reload; we stash the instance on globalThis.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
