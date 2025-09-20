import { Response } from 'express';
import { ApiResponse } from '../types';

export interface ErrorResponseOptions {
  statusCode?: number;
  message?: string;
  errors?: string[];
  errorCode?: string;
  correlationId?: string;
  details?: any;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string | undefined;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, _errors?: string[], details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, errorCode?: string, details?: any) {
    super(message, 500, errorCode || 'DATABASE_ERROR', true, details);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(
      message || `External service error: ${service}`,
      502,
      'EXTERNAL_SERVICE_ERROR'
    );
    this.name = 'ExternalServiceError';
  }
}

export const sendErrorResponse = (
  res: Response,
  options: ErrorResponseOptions
): void => {
  const {
    statusCode = 500,
    message = 'Internal server error',
    errors,
    errorCode,
    correlationId,
    details
  } = options;

  const response: ApiResponse = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(errorCode && { errorCode }),
    ...(details && { details }),
  };

  // Add correlation ID to response headers for debugging
  if (correlationId) {
    res.set('X-Correlation-ID', correlationId);
  }

  if (errorCode) {
    res.set('X-Error-Code', errorCode);
  }

  res.status(statusCode).json(response);
};

export const sendSuccessResponse = (
  res: Response,
  data: any,
  message: string = 'Success',
  statusCode: number = 200
): void => {
  const response: ApiResponse = {
    success: true,
    message,
    data,
  };

  res.status(statusCode).json(response);
};

export const handleAsyncError = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createErrorResponse = (
  message: string,
  _statusCode: number = 500,
  errorCode?: string,
  errors?: string[]
): ApiResponse => {
  return {
    success: false,
    message,
    ...(errorCode && { errorCode }),
    ...(errors && { errors }),
  };
};

export const createSuccessResponse = (
  data: any,
  message: string = 'Success'
): ApiResponse => {
  return {
    success: true,
    message,
    data,
  };
};
