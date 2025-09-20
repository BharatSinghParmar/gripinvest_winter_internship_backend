import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { 
  AppError, 
  sendErrorResponse, 
  NotFoundError
} from '../utils/errorResponse';

export const errorHandlerV2 = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Enhanced error logging with correlation ID
  const correlationId = req.headers['x-correlation-id'] as string || 'unknown';
  const timestamp = new Date().toISOString();
  
  // Log error details
  console.error('Error occurred:', {
    correlationId,
    timestamp,
    error: {
      name: error.name,
      message: error.message,
      stack: process.env['NODE_ENV'] === 'development' ? error.stack : undefined,
      code: (error as any).code,
      statusCode: (error as any).statusCode,
      errorCode: (error as any).errorCode,
    },
    request: {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as any).user?.id,
    },
    environment: {
      nodeEnv: process.env['NODE_ENV'],
      nodeVersion: process.version,
    },
  });

  // Handle different types of errors
  if (error instanceof AppError) {
    // Custom application errors
    sendErrorResponse(res, {
      statusCode: error.statusCode,
      message: error.message,
      ...(error.errorCode && { errorCode: error.errorCode }),
      correlationId,
      details: error.details,
    });
    return;
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    sendErrorResponse(res, {
      statusCode: 400,
      message: 'Validation failed',
      errors,
      errorCode: 'VALIDATION_ERROR',
      correlationId,
    });
    return;
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(error);
    sendErrorResponse(res, {
      statusCode: prismaError.statusCode,
      message: prismaError.message,
      errorCode: prismaError.errorCode,
      correlationId,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    sendErrorResponse(res, {
      statusCode: 400,
      message: 'Invalid data provided',
      errorCode: 'VALIDATION_ERROR',
      correlationId,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    sendErrorResponse(res, {
      statusCode: 503,
      message: 'Database connection failed',
      errorCode: 'DATABASE_CONNECTION_ERROR',
      correlationId,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    sendErrorResponse(res, {
      statusCode: 500,
      message: 'Database engine error',
      errorCode: 'DATABASE_ENGINE_ERROR',
      correlationId,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    sendErrorResponse(res, {
      statusCode: 500,
      message: 'Unknown database error',
      errorCode: 'DATABASE_UNKNOWN_ERROR',
      correlationId,
    });
    return;
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    sendErrorResponse(res, {
      statusCode: 401,
      message: 'Invalid access token',
      errorCode: 'INVALID_TOKEN',
      correlationId,
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    sendErrorResponse(res, {
      statusCode: 401,
      message: 'Access token expired',
      errorCode: 'TOKEN_EXPIRED',
      correlationId,
    });
    return;
  }

  // Rate limiting errors
  if (error.message.includes('Too many requests') || error.message.includes('Rate limit')) {
    sendErrorResponse(res, {
      statusCode: 429,
      message: 'Too many requests',
      errorCode: 'RATE_LIMIT_EXCEEDED',
      correlationId,
    });
    return;
  }

  // Network errors
  if (error.message.includes('ECONNREFUSED') || error.message.includes('Connection refused')) {
    sendErrorResponse(res, {
      statusCode: 503,
      message: 'Service unavailable',
      errorCode: 'CONNECTION_REFUSED',
      correlationId,
    });
    return;
  }

  if (error.message.includes('ETIMEDOUT') || error.message.includes('Connection timeout')) {
    sendErrorResponse(res, {
      statusCode: 504,
      message: 'Request timeout',
      errorCode: 'CONNECTION_TIMEOUT',
      correlationId,
    });
    return;
  }

  // Default error handling
  const statusCode = (error as any).statusCode || 500;
  const message = process.env['NODE_ENV'] === 'production' 
    ? 'Internal server error' 
    : error.message;

  sendErrorResponse(res, {
    statusCode,
    message,
    errorCode: 'INTERNAL_SERVER_ERROR',
    correlationId,
  });
};

const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError) => {
  const errorCode = error.code;
  
  switch (errorCode) {
    case 'P2000':
      return { statusCode: 400, message: 'Input value too long for column', errorCode };
    case 'P2001':
      return { statusCode: 404, message: 'Record not found', errorCode };
    case 'P2002':
      return { statusCode: 409, message: 'Unique constraint violation', errorCode };
    case 'P2003':
      return { statusCode: 400, message: 'Foreign key constraint violation', errorCode };
    case 'P2004':
      return { statusCode: 400, message: 'Constraint failed on database', errorCode };
    case 'P2005':
      return { statusCode: 400, message: 'Value not valid for field type', errorCode };
    case 'P2006':
      return { statusCode: 400, message: 'Value not valid for field', errorCode };
    case 'P2007':
      return { statusCode: 400, message: 'Data validation error', errorCode };
    case 'P2008':
      return { statusCode: 400, message: 'Failed to parse query', errorCode };
    case 'P2009':
      return { statusCode: 400, message: 'Failed to validate query', errorCode };
    case 'P2010':
      return { statusCode: 500, message: 'Raw query failed', errorCode };
    case 'P2011':
      return { statusCode: 400, message: 'Null constraint violation', errorCode };
    case 'P2012':
      return { statusCode: 400, message: 'Missing required value', errorCode };
    case 'P2013':
      return { statusCode: 400, message: 'Missing required argument', errorCode };
    case 'P2014':
      return { statusCode: 400, message: 'Relation constraint violation', errorCode };
    case 'P2015':
      return { statusCode: 404, message: 'Related record not found', errorCode };
    case 'P2016':
      return { statusCode: 400, message: 'Query interpretation error', errorCode };
    case 'P2017':
      return { statusCode: 400, message: 'Records for relation not connected', errorCode };
    case 'P2018':
      return { statusCode: 400, message: 'Required connected records not found', errorCode };
    case 'P2019':
      return { statusCode: 400, message: 'Input error', errorCode };
    case 'P2020':
      return { statusCode: 400, message: 'Value out of range', errorCode };
    case 'P2021':
      return { statusCode: 404, message: 'Table does not exist', errorCode };
    case 'P2022':
      return { statusCode: 404, message: 'Column does not exist', errorCode };
    case 'P2025':
      return { statusCode: 404, message: 'Record not found for update/delete operation', errorCode };
    case 'P2027':
      return { statusCode: 400, message: 'Multiple errors occurred during query execution', errorCode };
    case 'P2030':
      return { statusCode: 400, message: 'Full-text search index not found', errorCode };
    case 'P2031':
      return { statusCode: 400, message: 'MongoDB replica set not initialized', errorCode };
    case 'P2033':
      return { statusCode: 400, message: 'Number out of range for 64-bit signed integer', errorCode };
    case 'P2034':
      return { statusCode: 400, message: 'Transaction failed due to conflict with another transaction', errorCode };
    default:
      return { statusCode: 400, message: 'Database operation failed', errorCode };
  }
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, _res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};
