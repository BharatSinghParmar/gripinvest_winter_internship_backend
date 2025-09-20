import { PrismaClient } from '@prisma/client';
import { setupTestDatabase, teardownTestDatabase } from './helpers/database';

// Create Prisma client for tests
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env['TEST_DATABASE_URL'] || 'mysql://root:root@localhost:3307/grip_test',
    },
  },
});

// Global test setup
beforeAll(async () => {
  await setupTestDatabase(prisma);
});

afterAll(async () => {
  await teardownTestDatabase(prisma);
  await prisma.$disconnect();
});

export { prisma };
