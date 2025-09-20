import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const resolvedDatabaseUrl =
  (process.env['NODE_ENV'] === 'test' && process.env['TEST_DATABASE_URL'])
    ? process.env['TEST_DATABASE_URL']
    : (process.env['DATABASE_URL'] || 'mysql://root:root@localhost:3307/grip');

export const prisma = globalThis.__prisma || new PrismaClient({
  datasources: {
    db: {
      url: resolvedDatabaseUrl,
    },
  },
  log: process.env['NODE_ENV'] === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Database connection health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

if (process.env['NODE_ENV'] !== 'production') {
  globalThis.__prisma = prisma;
}
