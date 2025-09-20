import jwt from 'jsonwebtoken';
import { User } from '../types';

const ACCESS_SECRET = process.env['JWT_ACCESS_SECRET'];
const REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'];
const ACCESS_TTL = process.env['ACCESS_TOKEN_TTL'] || '15m';
const REFRESH_TTL = process.env['REFRESH_TOKEN_TTL'] || '7d';

// Validate required environment variables
if (!ACCESS_SECRET) {
  throw new Error('JWT_ACCESS_SECRET environment variable is required');
}
if (!REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET environment variable is required');
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const signAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET as string, { expiresIn: ACCESS_TTL as any });
};

export const signRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET as string, { expiresIn: REFRESH_TTL as any });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, ACCESS_SECRET as string) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    }
    throw new Error('Token verification failed');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, REFRESH_SECRET as string) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    throw new Error('Token verification failed');
  }
};

export const getUserFromToken = (user: User): TokenPayload => ({
  userId: user.id,
  email: user.email,
  role: user.role,
});
