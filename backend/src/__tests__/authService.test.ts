import { AuthService } from '../services/authService';
import { prisma } from '../prisma/client';
import { hashPassword, comparePassword, hashRefreshToken, compareRefreshToken } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken, getUserFromToken } from '../utils/jwt';

// Mock dependencies
jest.mock('../prisma/client', () => ({
  prisma: {
    users: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    refresh_tokens: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    },
    $transaction: jest.fn()
  }
}));
jest.mock('../utils/password');
jest.mock('../utils/jwt');

const mockPrisma = prisma as any;
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;
const mockHashRefreshToken = hashRefreshToken as jest.MockedFunction<typeof hashRefreshToken>;
const mockCompareRefreshToken = compareRefreshToken as jest.MockedFunction<typeof compareRefreshToken>;
const mockSignAccessToken = signAccessToken as jest.MockedFunction<typeof signAccessToken>;
const mockSignRefreshToken = signRefreshToken as jest.MockedFunction<typeof signRefreshToken>;
const mockVerifyRefreshToken = verifyRefreshToken as jest.MockedFunction<typeof verifyRefreshToken>;
const mockGetUserFromToken = getUserFromToken as jest.MockedFunction<typeof getUserFromToken>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const validSignupInput = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password: 'Password123!',
      risk_appetite: 'moderate' as const
    };

    it('should successfully signup a new user', async () => {
      // Mock database responses
      mockPrisma.users.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          users: {
            create: jest.fn().mockResolvedValue({
              id: '1',
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com',
              risk_appetite: 'moderate',
              role: 'user',
              created_at: new Date(),
              updated_at: new Date()
            })
          },
          refresh_tokens: {
            create: jest.fn().mockResolvedValue({})
          }
        };
        return await callback(mockTx as any);
      });

      // Mock utility functions
      mockHashPassword.mockResolvedValue('hashed_password');
      mockGetUserFromToken.mockReturnValue({
        userId: '1',
        email: 'john@example.com',
        role: 'user'
      });
      mockSignAccessToken.mockReturnValue('access_token');
      mockSignRefreshToken.mockReturnValue('refresh_token');
      mockHashRefreshToken.mockResolvedValue('hashed_refresh_token');

      const result = await authService.signup(validSignupInput);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('john@example.com');
      expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' }
      });
    });

    it('should throw error if user already exists', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        risk_appetite: 'moderate',
        role: 'user',
        created_at: new Date(),
        updated_at: new Date()
      } as any);

      await expect(authService.signup(validSignupInput))
        .rejects.toThrow('User already exists with this email');
    });
  });

  describe('login', () => {
    const validLoginInput = {
      email: 'john@example.com',
      password: 'Password123!'
    };

    const mockUser = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password_hash: 'hashed_password',
      risk_appetite: 'moderate',
      role: 'user',
      created_at: new Date(),
      updated_at: new Date()
    };

    it('should successfully login with valid credentials', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);
      mockComparePassword.mockResolvedValue(true);
      mockGetUserFromToken.mockReturnValue({
        userId: '1',
        email: 'john@example.com',
        role: 'user'
      });
      mockSignAccessToken.mockReturnValue('access_token');
      mockSignRefreshToken.mockReturnValue('refresh_token');
      mockHashRefreshToken.mockResolvedValue('hashed_refresh_token');
      mockPrisma.refresh_tokens.create.mockResolvedValue({} as any);

      const result = await authService.login(validLoginInput);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('john@example.com');
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should throw error for non-existent user', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      await expect(authService.login(validLoginInput))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);
      mockComparePassword.mockResolvedValue(false);

      await expect(authService.login(validLoginInput))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshToken', () => {
    const mockRefreshToken = 'valid_refresh_token';
    const mockUser = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      risk_appetite: 'moderate',
      role: 'user',
      created_at: new Date(),
      updated_at: new Date()
    };

    it('should successfully refresh tokens', async () => {
      mockVerifyRefreshToken.mockReturnValue({ userId: '1', email: 'test@example.com', role: 'user' });
      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.refresh_tokens.findFirst.mockResolvedValue({
        id: '1',
        user_id: '1',
        token_hash: 'hashed_token',
        is_revoked: false,
        expires_at: new Date(Date.now() + 86400000),
        created_at: new Date()
      } as any);
      mockCompareRefreshToken.mockResolvedValue(true);
      mockGetUserFromToken.mockReturnValue({
        userId: '1',
        email: 'john@example.com',
        role: 'user'
      });
      mockSignAccessToken.mockReturnValue('new_access_token');
      mockSignRefreshToken.mockReturnValue('new_refresh_token');
      mockHashRefreshToken.mockResolvedValue('new_hashed_refresh_token');
      mockPrisma.refresh_tokens.update.mockResolvedValue({} as any);
      mockPrisma.refresh_tokens.create.mockResolvedValue({} as any);

      const result = await authService.refreshToken(mockRefreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrisma.refresh_tokens.update).toHaveBeenCalled();
      expect(mockPrisma.refresh_tokens.create).toHaveBeenCalled();
    });

    it('should throw error for invalid refresh token', async () => {
      mockVerifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken('invalid_token'))
        .rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if user not found', async () => {
      mockVerifyRefreshToken.mockReturnValue({ userId: '1', email: 'test@example.com', role: 'user' });
      mockPrisma.users.findUnique.mockResolvedValue(null);

      await expect(authService.refreshToken(mockRefreshToken))
        .rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('should revoke all refresh tokens for user', async () => {
      mockPrisma.refresh_tokens.updateMany.mockResolvedValue({ count: 2 });

      await authService.logout('1');

      expect(mockPrisma.refresh_tokens.updateMany).toHaveBeenCalledWith({
        where: {
          user_id: '1',
          is_revoked: false
        },
        data: {
          is_revoked: true
        }
      });
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        risk_appetite: 'moderate',
        role: 'user',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPrisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await authService.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          risk_appetite: true,
          role: true,
          created_at: true,
          updated_at: true
        }
      });
    });

    it('should return null if user not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      const result = await authService.getUserById('999');

      expect(result).toBeNull();
    });
  });
});
