import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { OTPService } from '../services/otpService';
import { PasswordStrengthService } from '../services/passwordStrengthService';
import { ApiResponse, RequestWithUser } from '../types';
import { asyncHandler } from '../middleware/asyncHandler';

const authService = new AuthService();
const otpService = new OTPService();
const passwordStrengthService = new PasswordStrengthService();

export const signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.signup(req.body);
  
  // Set refresh token as httpOnly cookie
  res.cookie('refresh_token', result.refreshToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const response: ApiResponse = {
    success: true,
    message: 'User registered successfully',
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  };

  res.status(201).json(response);
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.login(req.body);
  
  // Set refresh token as httpOnly cookie
  res.cookie('refresh_token', result.refreshToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const response: ApiResponse = {
    success: true,
    message: 'Login successful',
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  };

  res.status(200).json(response);
});

export const refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies['refresh_token'];
  
  if (!refreshToken) {
    const response: ApiResponse = {
      success: false,
      message: 'Refresh token required',
    };
    res.status(401).json(response);
    return;
  }

  const result = await authService.refreshToken(refreshToken);
  
  // Set new refresh token as httpOnly cookie
  res.cookie('refresh_token', result.refreshToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const response: ApiResponse = {
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: result.accessToken,
    },
  };

  res.status(200).json(response);
});

export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userReq = req as RequestWithUser;
  if (userReq.user) {
    await authService.logout(userReq.user.id);
  }

  // Clear refresh token cookie
  res.clearCookie('refresh_token');

  const response: ApiResponse = {
    success: true,
    message: 'Logout successful',
  };

  res.status(200).json(response);
});

export const me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userReq = req as RequestWithUser;

  const response: ApiResponse = {
    success: true,
    message: 'Current user',
    data: userReq.user,
  };

  res.status(200).json(response);
});

export const requestPasswordReset = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await otpService.sendPasswordResetOTP(req.body.email);

  const response: ApiResponse = {
    success: result.success,
    message: result.message,
  };

  res.status(200).json(response);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, otp, newPassword } = req.body;

  const result = await otpService.verifyOTPAndResetPassword(email, otp, newPassword);

  const response: ApiResponse = {
    success: result.success,
    message: result.message,
  };

  res.status(200).json(response);
});

export const checkPasswordStrength = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body;
  
  const strengthResult = passwordStrengthService.analyzePasswordStrength(password);

  const response: ApiResponse = {
    success: true,
    message: 'Password strength analyzed',
    data: strengthResult,
  };

  res.status(200).json(response);
});