import { PrismaClient } from '@prisma/client';

export const cleanDatabase = async (prisma: PrismaClient): Promise<void> => {
  try {
    // Disable foreign key checks
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;
    
    // Delete all data in correct order
    await prisma.$executeRaw`DELETE FROM transaction_logs`;
    await prisma.$executeRaw`DELETE FROM refresh_tokens`;
    await prisma.$executeRaw`DELETE FROM investments`;
    await prisma.$executeRaw`DELETE FROM investment_products`;
    await prisma.$executeRaw`DELETE FROM password_otps`;
    await prisma.$executeRaw`DELETE FROM users`;
    
    // Re-enable foreign key checks
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
  } catch (error) {
    console.warn('Database cleanup failed:', error);
    // Try to re-enable foreign key checks even if cleanup failed
    try {
      await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
    } catch (e) {
      // Ignore this error
    }
  }
};

export const setupTestDatabase = async (prisma: PrismaClient): Promise<void> => {
  await cleanDatabase(prisma);
};

export const teardownTestDatabase = async (prisma: PrismaClient): Promise<void> => {
  await cleanDatabase(prisma);
};

