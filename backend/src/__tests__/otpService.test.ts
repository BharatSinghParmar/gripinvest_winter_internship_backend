import { OTPService } from '../services/otpService';
import { prisma } from '../prisma/client';
import { hashPassword, comparePassword } from '../utils/password';

// Mock dependencies
jest.mock('../prisma/client', () => ({
  prisma: {
    users: {
      findUnique: jest.fn()
    },
    password_otps: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn()
    },
    refresh_tokens: {
      updateMany: jest.fn()
    },
    $transaction: jest.fn()
  }
}));
jest.mock('../utils/password');

const mockPrisma = prisma as any;
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;

describe('OTPService', () => {
  let otpService: OTPService;

  beforeEach(() => {
    otpService = new OTPService();
    jest.clearAllMocks();
  });

  describe('sendPasswordResetOTP', () => {
    it('should send OTP for existing user', async () => {
      const email = 'test@example.com';
      const mockUser = { id: '1', email };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser);
      mockPrisma.password_otps.count.mockResolvedValue(0);
      mockHashPassword.mockResolvedValue('hashed_otp');
      mockPrisma.password_otps.create.mockResolvedValue({});

      // Mock console.log to capture OTP output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await otpService.sendPasswordResetOTP(email);

      expect(result.success).toBe(true);
      expect(result.message).toContain('If an account with this email exists');
      expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
        where: { email },
        select: { id: true, email: true }
      });
      expect(mockPrisma.password_otps.create).toHaveBeenCalled();

      // Verify OTP was logged to console
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PASSWORD RESET OTP'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(email));

      consoleSpy.mockRestore();
    });

    it('should return success even for non-existent user (security)', async () => {
      const email = 'nonexistent@example.com';

      mockPrisma.users.findUnique.mockResolvedValue(null);

      const result = await otpService.sendPasswordResetOTP(email);

      expect(result.success).toBe(true);
      expect(result.message).toContain('If an account with this email exists');
      expect(mockPrisma.password_otps.create).not.toHaveBeenCalled();
    });

    it('should throw error when rate limit exceeded', async () => {
      const email = 'test@example.com';
      const mockUser = { id: '1', email };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser);
      mockPrisma.password_otps.count.mockResolvedValue(5); // Exceeds limit

      await expect(otpService.sendPasswordResetOTP(email))
        .rejects.toThrow('Failed to send password reset OTP');
    });

    it('should handle database errors gracefully', async () => {
      const email = 'test@example.com';
      const mockUser = { id: '1', email };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser);
      mockPrisma.password_otps.count.mockResolvedValue(0);
      mockPrisma.password_otps.create.mockRejectedValue(new Error('Database error'));

      await expect(otpService.sendPasswordResetOTP(email))
        .rejects.toThrow('Failed to send password reset OTP');
    });
  });

  describe('verifyOTPAndResetPassword', () => {
    const email = 'test@example.com';
    const otp = '123456';
    const newPassword = 'NewPassword123!';

    it('should successfully reset password with valid OTP', async () => {
      const mockOTPRecord = {
        id: 'otp1',
        email,
        otp_hash: 'hashed_otp',
        expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        consumed_at: null
      };

      mockPrisma.password_otps.findFirst.mockResolvedValue(mockOTPRecord);
      mockComparePassword.mockResolvedValue(true);
      mockHashPassword.mockResolvedValue('hashed_new_password');
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          users: { update: jest.fn().mockResolvedValue({}) },
          password_otps: { update: jest.fn().mockResolvedValue({}) },
          refresh_tokens: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) }
        };
        return await callback(mockTx as any);
      });

      const result = await otpService.verifyOTPAndResetPassword(email, otp, newPassword);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Password has been reset successfully');
      expect(mockComparePassword).toHaveBeenCalledWith(otp, mockOTPRecord.otp_hash);
    });

    it('should throw error for invalid OTP', async () => {
      const mockOTPRecord = {
        id: 'otp1',
        email,
        otp_hash: 'hashed_otp',
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
        consumed_at: null
      };

      mockPrisma.password_otps.findFirst.mockResolvedValue(mockOTPRecord);
      mockComparePassword.mockResolvedValue(false);

      await expect(otpService.verifyOTPAndResetPassword(email, otp, newPassword))
        .rejects.toThrow('Invalid OTP');
    });

    it('should throw error for expired OTP', async () => {
      mockPrisma.password_otps.findFirst.mockResolvedValue(null);

      await expect(otpService.verifyOTPAndResetPassword(email, otp, newPassword))
        .rejects.toThrow('Invalid or expired OTP');
    });

    it('should throw error for already consumed OTP', async () => {
      mockPrisma.password_otps.findFirst.mockResolvedValue(null);

      await expect(otpService.verifyOTPAndResetPassword(email, otp, newPassword))
        .rejects.toThrow('Invalid or expired OTP');
    });
  });

  describe('cleanupExpiredOTPs', () => {
    it('should delete expired OTPs', async () => {
      mockPrisma.password_otps.deleteMany.mockResolvedValue({ count: 5 });

      const result = await otpService.cleanupExpiredOTPs();

      expect(result).toBe(5);
      expect(mockPrisma.password_otps.deleteMany).toHaveBeenCalledWith({
        where: {
          expires_at: { lt: expect.any(Date) }
        }
      });
    });
  });

  describe('getOTPStats', () => {
    it('should return OTP statistics', async () => {
      mockPrisma.password_otps.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3)  // active
        .mockResolvedValueOnce(5)  // expired
        .mockResolvedValueOnce(2); // consumed

      const result = await otpService.getOTPStats();

      expect(result).toEqual({
        totalOTPs: 10,
        activeOTPs: 3,
        expiredOTPs: 5,
        consumedOTPs: 2
      });
    });
  });
});
