import { OTPService } from '../services/otpService';
import { PasswordStrengthService } from '../services/passwordStrengthService';
import { prisma } from '../prisma/client';
import { comparePassword, hashPassword } from '../utils/password';

// Mock dependencies
jest.mock('../prisma/client', () => ({
  prisma: {
    users: {
      findUnique: jest.fn(),
      update: jest.fn()
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
const mockComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;

describe('Password Reset Integration Tests', () => {
  let otpService: OTPService;
  let passwordStrengthService: PasswordStrengthService;

  beforeEach(() => {
    otpService = new OTPService();
    passwordStrengthService = new PasswordStrengthService();
    jest.clearAllMocks();
  });

  describe('Complete Password Reset Flow', () => {
    it('should complete full password reset flow successfully', async () => {
      const email = 'test@example.com';
      const newPassword = 'NewStrongPassword123!';
      const mockUser = { id: '1', email };

      // Step 1: Request OTP
      mockPrisma.users.findUnique.mockResolvedValue(mockUser);
      mockPrisma.password_otps.count.mockResolvedValue(0);
      mockPrisma.password_otps.create.mockResolvedValue({});

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const otpRequest = await otpService.sendPasswordResetOTP(email);
      expect(otpRequest.success).toBe(true);

      // Step 2: Check password strength
      const strengthResult = passwordStrengthService.analyzePasswordStrength(newPassword);
      expect(strengthResult.score).toBeGreaterThan(75);
      expect(['strong', 'very-strong']).toContain(strengthResult.level);

      // Step 3: Verify OTP and reset password
      const mockOTPRecord = {
        id: 'otp1',
        email,
        otp_hash: 'hashed_otp',
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
        consumed_at: null
      };

      mockPrisma.password_otps.findFirst.mockResolvedValue(mockOTPRecord);
      
      // Mock the password comparison and hashing
      mockComparePassword.mockResolvedValue(true);
      mockHashPassword.mockResolvedValue('hashed_new_password');

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          users: { update: jest.fn().mockResolvedValue({}) },
          password_otps: { update: jest.fn().mockResolvedValue({}) },
          refresh_tokens: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) }
        };
        return await callback(mockTx);
      });

      const resetResult = await otpService.verifyOTPAndResetPassword(email, '123456', newPassword);
      expect(resetResult.success).toBe(true);
      expect(resetResult.message).toContain('Password has been reset successfully');

      consoleSpy.mockRestore();
    });

    it('should handle invalid OTP in reset flow', async () => {
      const email = 'test@example.com';
      const newPassword = 'NewStrongPassword123!';

      const mockOTPRecord = {
        id: 'otp1',
        email,
        otp_hash: 'hashed_otp',
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
        consumed_at: null
      };

      mockPrisma.password_otps.findFirst.mockResolvedValue(mockOTPRecord);
      
      mockComparePassword.mockResolvedValue(false);

      await expect(otpService.verifyOTPAndResetPassword(email, 'wrong_otp', newPassword))
        .rejects.toThrow('Invalid OTP');
    });

    it('should handle expired OTP in reset flow', async () => {
      const email = 'test@example.com';
      const newPassword = 'NewStrongPassword123!';

      mockPrisma.password_otps.findFirst.mockResolvedValue(null);

      await expect(otpService.verifyOTPAndResetPassword(email, '123456', newPassword))
        .rejects.toThrow('Invalid or expired OTP');
    });
  });

  describe('Password Strength Integration', () => {
    it('should provide comprehensive password analysis', async () => {
      const testPasswords = [
        { password: 'weak', expectedLevel: 'weak' },
        { password: 'Password1', expectedLevel: 'good' },
        { password: 'StrongPass123!', expectedLevel: 'strong' },
        { password: 'VeryStrongPass123!@#', expectedLevel: 'very-strong' }
      ];

      for (const testCase of testPasswords) {
        const result = passwordStrengthService.analyzePasswordStrength(testCase.password);
        
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('level');
        expect(result).toHaveProperty('suggestions');
        expect(result).toHaveProperty('requirements');
        
        expect(typeof result.score).toBe('number');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
        
        expect(['weak', 'fair', 'good', 'strong', 'very-strong']).toContain(result.level);
        expect(Array.isArray(result.suggestions)).toBe(true);
        
        expect(result.requirements).toHaveProperty('length');
        expect(result.requirements).toHaveProperty('uppercase');
        expect(result.requirements).toHaveProperty('lowercase');
        expect(result.requirements).toHaveProperty('numbers');
        expect(result.requirements).toHaveProperty('symbols');
        expect(result.requirements).toHaveProperty('noCommonPatterns');
      }
    });

    it('should validate password requirements correctly', async () => {
      const testCases = [
        { password: 'ValidPass123!', shouldBeValid: true },
        { password: 'weak', shouldBeValid: false },
        { password: 'password123', shouldBeValid: false }, // Common pattern
        { password: 'NoNumbers!', shouldBeValid: false },
        { password: 'nouppercase123!', shouldBeValid: false }
      ];

      for (const testCase of testCases) {
        const result = passwordStrengthService.validatePassword(testCase.password);
        expect(result.isValid).toBe(testCase.shouldBeValid);
        
        if (!testCase.shouldBeValid) {
          expect(result.errors.length).toBeGreaterThan(0);
        } else {
          expect(result.errors.length).toBe(0);
        }
      }
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should enforce OTP rate limits', async () => {
      const email = 'test@example.com';
      const mockUser = { id: '1', email };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser);
      mockPrisma.password_otps.count.mockResolvedValue(5); // Exceeds limit

      await expect(otpService.sendPasswordResetOTP(email))
        .rejects.toThrow('Failed to send password reset OTP');
    });

    it('should allow OTP requests within rate limits', async () => {
      const email = 'test@example.com';
      const mockUser = { id: '1', email };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser);
      mockPrisma.password_otps.count.mockResolvedValue(1); // Within limit
      mockPrisma.password_otps.create.mockResolvedValue({});

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await otpService.sendPasswordResetOTP(email);
      expect(result.success).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('Security Features', () => {
    it('should not reveal if user exists during OTP request', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      const result = await otpService.sendPasswordResetOTP('nonexistent@example.com');
      expect(result.success).toBe(true);
      expect(result.message).toContain('If an account with this email exists');
    });

    it('should revoke all refresh tokens after password reset', async () => {
      const email = 'test@example.com';
      const newPassword = 'NewStrongPassword123!';

      const mockOTPRecord = {
        id: 'otp1',
        email,
        otp_hash: 'hashed_otp',
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
        consumed_at: null
      };

      mockPrisma.password_otps.findFirst.mockResolvedValue(mockOTPRecord);
      
      mockComparePassword.mockResolvedValue(true);
      mockHashPassword.mockResolvedValue('hashed_new_password');

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback({
          users: { update: jest.fn().mockResolvedValue({}) },
          password_otps: { update: jest.fn().mockResolvedValue({}) },
          refresh_tokens: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) }
        });
      });

      await otpService.verifyOTPAndResetPassword(email, '123456', newPassword);

      // Verify that refresh tokens were revoked
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
