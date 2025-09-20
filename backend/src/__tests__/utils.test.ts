// Unit tests for utility functions
import { describe, it, expect } from '@jest/globals';
import { signAccessToken, verifyAccessToken } from '../utils/jwt';
import { hashPassword, comparePassword } from '../utils/password';

describe('JWT Utils', () => {
  it('should generate and verify token', () => {
    const payload = { userId: '1', email: 'test@example.com', role: 'user' };
    const token = signAccessToken(payload);
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    
    const decoded = verifyAccessToken(token);
    expect(decoded).toBeDefined();
    expect(decoded.userId).toBe('1');
    expect(decoded.email).toBe('test@example.com');
  });

  it('should throw error for invalid token', () => {
    expect(() => {
      verifyAccessToken('invalid-token');
    }).toThrow();
  });
});

describe('Password Utils', () => {
  it('should hash and compare password', async () => {
    const password = 'testpassword123';
    const hashed = await hashPassword(password);
    
    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(password);
    
    const isValid = await comparePassword(password, hashed);
    expect(isValid).toBe(true);
  });

  it('should reject wrong password', async () => {
    const password = 'testpassword123';
    const wrongPassword = 'wrongpassword';
    const hashed = await hashPassword(password);
    
    const isValid = await comparePassword(wrongPassword, hashed);
    expect(isValid).toBe(false);
  });
});
