import { prisma } from '../prisma/client';
import { hashPassword } from '../utils/password';
import crypto from 'crypto';

export class OTPService {
  // private readonly OTP_LENGTH = 6; // Currently unused but kept for future reference
  private readonly OTP_EXPIRY_MINUTES = 15;
  private readonly MAX_OTP_ATTEMPTS = 3;
  private readonly OTP_COOLDOWN_MINUTES = 15;

  /**
   * Generate a 6-digit OTP
   */
  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Send OTP to console for development (instead of email)
   */
  private async sendOTPToConsole(email: string, otp: string): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('🔐 PASSWORD RESET OTP');
    console.log('='.repeat(60));
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 OTP Code: ${otp}`);
    console.log(`⏰ Expires in: ${this.OTP_EXPIRY_MINUTES} minutes`);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Check if user has exceeded OTP rate limits
   */
  private async checkRateLimit(email: string): Promise<void> {
    const recentOTPs = await prisma.password_otps.count({
      where: {
        email,
        created_at: {
          gte: new Date(Date.now() - this.OTP_COOLDOWN_MINUTES * 60 * 1000)
        }
      }
    });

    if (recentOTPs >= this.MAX_OTP_ATTEMPTS) {
      throw new Error(`Too many OTP requests. Please wait ${this.OTP_COOLDOWN_MINUTES} minutes before requesting another OTP.`);
    }
  }

  /**
   * Send OTP for password reset
   */
  async sendPasswordResetOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user exists
      const user = await prisma.users.findUnique({
        where: { email },
        select: { id: true, email: true }
      });

      if (!user) {
        // Don't reveal if user exists or not for security
        return {
          success: true,
          message: 'If an account with this email exists, an OTP has been sent.'
        };
      }

      // Check rate limits
      await this.checkRateLimit(email);

      // Generate OTP
      const otp = this.generateOTP();
      const otpHash = await hashPassword(otp);

      // Set expiry time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

      // Store OTP in database
      await prisma.password_otps.create({
        data: {
          email,
          otp_hash: otpHash,
          expires_at: expiresAt
        }
      });

      // Send OTP to console for development
      await this.sendOTPToConsole(email, otp);

      return {
        success: true,
        message: 'If an account with this email exists, an OTP has been sent.'
      };
    } catch (error) {
      console.error('Error sending password reset OTP:', error);
      throw new Error('Failed to send password reset OTP. Please try again later.');
    }
  }

  /**
   * Verify OTP and reset password
   */
  async verifyOTPAndResetPassword(
    email: string, 
    otp: string, 
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find valid OTP
      const otpRecord = await prisma.password_otps.findFirst({
        where: {
          email,
          expires_at: { gt: new Date() },
          consumed_at: null
        },
        orderBy: { created_at: 'desc' }
      });

      if (!otpRecord) {
        throw new Error('Invalid or expired OTP. Please request a new one.');
      }

      // Verify OTP
      const { comparePassword } = await import('../utils/password');
      const isValidOTP = await comparePassword(otp, otpRecord.otp_hash);

      if (!isValidOTP) {
        throw new Error('Invalid OTP. Please check your code and try again.');
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password and mark OTP as consumed
      await prisma.$transaction(async (tx) => {
        // Update user password
        await tx.users.update({
          where: { email },
          data: { password_hash: newPasswordHash }
        });

        // Mark OTP as consumed
        await tx.password_otps.update({
          where: { id: otpRecord.id },
          data: { consumed_at: new Date() }
        });

        // Revoke all refresh tokens for security
        await tx.refresh_tokens.updateMany({
          where: { 
            user: { email },
            is_revoked: false 
          },
          data: { is_revoked: true }
        });
      });

      return {
        success: true,
        message: 'Password has been reset successfully. Please login with your new password.'
      };
    } catch (error) {
      console.error('Error verifying OTP and resetting password:', error);
      throw error;
    }
  }

  /**
   * Clean up expired OTPs (can be called by a cron job)
   */
  async cleanupExpiredOTPs(): Promise<number> {
    const result = await prisma.password_otps.deleteMany({
      where: {
        expires_at: { lt: new Date() }
      }
    });

    return result.count;
  }

  /**
   * Get OTP statistics for monitoring
   */
  async getOTPStats(): Promise<{
    totalOTPs: number;
    activeOTPs: number;
    expiredOTPs: number;
    consumedOTPs: number;
  }> {
    const [total, active, expired, consumed] = await Promise.all([
      prisma.password_otps.count(),
      prisma.password_otps.count({
        where: {
          expires_at: { gt: new Date() },
          consumed_at: null
        }
      }),
      prisma.password_otps.count({
        where: {
          expires_at: { lt: new Date() }
        }
      }),
      prisma.password_otps.count({
        where: {
          consumed_at: { not: null }
        }
      })
    ]);

    return {
      totalOTPs: total,
      activeOTPs: active,
      expiredOTPs: expired,
      consumedOTPs: consumed
    };
  }
}
