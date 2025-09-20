import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../prisma/client';
import { ApiResponse, RequestWithUser } from '../types';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response: ApiResponse = {
        success: false,
        message: 'Access token required',
      };
      res.status(401).json(response);
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
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
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      res.status(401).json(response);
      return;
    }

    (req as RequestWithUser).user = user;
    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid or expired token',
    };
    res.status(401).json(response);
  }
};

export const requireRole = (role: 'admin' | 'user') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userReq = req as RequestWithUser;
    if (!userReq.user) {
      const response: ApiResponse = {
        success: false,
        message: 'Authentication required',
      };
      res.status(401).json(response);
      return;
    }

    if (userReq.user.role !== role && userReq.user.role !== 'admin') {
      const response: ApiResponse = {
        success: false,
        message: 'Insufficient permissions',
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
};
