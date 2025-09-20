import { signAccessToken, verifyAccessToken, getUserFromToken } from '../../utils/jwt';
import { User } from '../../types';

// Mock environment variables
process.env['JWT_ACCESS_SECRET'] = 'test-access-secret';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret';

describe('JWT Utils', () => {
  const mockUser: User = {
    id: 'test-user-id',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    risk_appetite: 'moderate',
    role: 'user',
    created_at: new Date(),
    updated_at: new Date(),
  };

  describe('signAccessToken', () => {
    it('should sign an access token', () => {
      const token = signAccessToken(getUserFromToken(mockUser));
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = signAccessToken(getUserFromToken(mockUser));
      const payload = verifyAccessToken(token);
      
      expect(payload.userId).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => verifyAccessToken(invalidToken)).toThrow();
    });
  });

  describe('getUserFromToken', () => {
    it('should convert user to token payload', () => {
      const payload = getUserFromToken(mockUser);
      
      expect(payload.userId).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
    });
  });
});
