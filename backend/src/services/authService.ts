import { prisma } from '../prisma/client';
import { hashPassword, comparePassword, hashRefreshToken, compareRefreshToken } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken, getUserFromToken } from '../utils/jwt';
import { SignupInput, LoginInput, User } from '../types';

export class AuthService {
  async signup(input: SignupInput): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const { first_name, last_name, email, password, risk_appetite } = input;

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user and refresh token in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          first_name,
          last_name: last_name || null,
          email,
          password_hash,
          risk_appetite,
          role: 'user',
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          risk_appetite: true,
          role: true,
          created_at: true,
          updated_at: true,
        },
      });

      // Generate tokens
      const tokenPayload = getUserFromToken(user);
      const accessToken = signAccessToken(tokenPayload);
      const refreshToken = signRefreshToken(tokenPayload);

      // Store refresh token
      const token_hash = await hashRefreshToken(refreshToken);
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + 7); // 7 days

      await tx.refresh_tokens.create({
        data: {
          user_id: user.id,
          token_hash,
          expires_at,
        },
      });

      return { user, accessToken, refreshToken };
    });

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }

  async login(input: LoginInput): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const { email, password } = input;

    // Find user
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        password_hash: true,
        risk_appetite: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const tokenPayload = getUserFromToken(user);
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Store refresh token
    const token_hash = await hashRefreshToken(refreshToken);
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7); // 7 days

    await prisma.refresh_tokens.create({
      data: {
        user_id: user.id,
        token_hash,
        expires_at,
      },
    });

    // Remove password_hash from response
    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Find user
      const user = await prisma.users.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          risk_appetite: true,
          role: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Find and verify stored refresh token
      const storedToken = await prisma.refresh_tokens.findFirst({
        where: {
          user_id: user.id,
          is_revoked: false,
          expires_at: { gt: new Date() },
        },
        orderBy: { created_at: 'desc' },
      });

      if (!storedToken) {
        throw new Error('Invalid refresh token');
      }

      const isValidToken = await compareRefreshToken(refreshToken, storedToken.token_hash);
      if (!isValidToken) {
        throw new Error('Invalid refresh token');
      }

      // Revoke old token
      await prisma.refresh_tokens.update({
        where: { id: storedToken.id },
        data: { is_revoked: true },
      });

      // Generate new tokens
      const tokenPayload = getUserFromToken(user);
      const accessToken = signAccessToken(tokenPayload);
      const newRefreshToken = signRefreshToken(tokenPayload);

      // Store new refresh token
      const token_hash = await hashRefreshToken(newRefreshToken);
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + 7); // 7 days

      await prisma.refresh_tokens.create({
        data: {
          user_id: user.id,
          token_hash,
          expires_at,
        },
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    // Revoke all refresh tokens for user
    await prisma.refresh_tokens.updateMany({
      where: {
        user_id: userId,
        is_revoked: false,
      },
      data: {
        is_revoked: true,
      },
    });
  }

  async getUserById(userId: string): Promise<User | null> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        risk_appetite: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });

    return user;
  }
}
