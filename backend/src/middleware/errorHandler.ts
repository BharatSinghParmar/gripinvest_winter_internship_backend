import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ApiResponse } from '../types';
// import { DatabaseDiagnostics } from '../services/databaseDiagnostics';

// Initialize database diagnostics
// const dbDiagnostics = new DatabaseDiagnostics();

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Enhanced error logging with correlation ID
  const correlationId = req.headers['x-correlation-id'] || 'unknown';
  const timestamp = new Date().toISOString();
  
  // Comprehensive error logging
  console.error('Error occurred:', {
    correlationId,
    timestamp,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
      errno: (error as any).errno,
      sqlState: (error as any).sqlState,
      sqlMessage: (error as any).sqlMessage,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    },
    environment: {
      nodeEnv: process.env['NODE_ENV'],
      nodeVersion: process.version,
    },
  });

  let statusCode = 500;
  let message = 'Internal server error';
  let errors: string[] | undefined;
  let errorCode: string | undefined;

  // Enhanced Prisma error handling
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    errorCode = error.code;
    
    switch (error.code) {
      case 'P2000':
        statusCode = 400;
        message = 'Input value too long for column';
        break;
      case 'P2001':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2002':
        statusCode = 409;
        message = 'Unique constraint violation';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint violation';
        break;
      case 'P2004':
        statusCode = 400;
        message = 'Constraint failed on database';
        break;
      case 'P2005':
        statusCode = 400;
        message = 'Value not valid for field type';
        break;
      case 'P2006':
        statusCode = 400;
        message = 'Value not valid for field';
        break;
      case 'P2007':
        statusCode = 400;
        message = 'Data validation error';
        break;
      case 'P2008':
        statusCode = 400;
        message = 'Failed to parse query';
        break;
      case 'P2009':
        statusCode = 400;
        message = 'Failed to validate query';
        break;
      case 'P2010':
        statusCode = 500;
        message = 'Raw query failed';
        break;
      case 'P2011':
        statusCode = 400;
        message = 'Null constraint violation';
        break;
      case 'P2012':
        statusCode = 400;
        message = 'Missing required value';
        break;
      case 'P2013':
        statusCode = 400;
        message = 'Missing required argument';
        break;
      case 'P2014':
        statusCode = 400;
        message = 'Relation constraint violation';
        break;
      case 'P2015':
        statusCode = 404;
        message = 'Related record not found';
        break;
      case 'P2016':
        statusCode = 400;
        message = 'Query interpretation error';
        break;
      case 'P2017':
        statusCode = 400;
        message = 'Records for relation not connected';
        break;
      case 'P2018':
        statusCode = 400;
        message = 'Required connected records not found';
        break;
      case 'P2019':
        statusCode = 400;
        message = 'Input error';
        break;
      case 'P2020':
        statusCode = 400;
        message = 'Value out of range';
        break;
      case 'P2021':
        statusCode = 404;
        message = 'Table does not exist';
        break;
      case 'P2022':
        statusCode = 404;
        message = 'Column does not exist';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found for update/delete operation';
        break;
      case 'P2027':
        statusCode = 400;
        message = 'Multiple errors occurred during query execution';
        break;
      case 'P2030':
        statusCode = 400;
        message = 'Full-text search index not found';
        break;
      case 'P2031':
        statusCode = 400;
        message = 'MongoDB replica set not initialized';
        break;
      case 'P2033':
        statusCode = 400;
        message = 'Number out of range for 64-bit signed integer';
        break;
      case 'P2034':
        statusCode = 400;
        message = 'Transaction failed due to conflict with another transaction';
        break;
      default:
        statusCode = 400;
        message = 'Database operation failed';
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
    errors = [error.message];
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = 'Database connection failed';
    errorCode = 'P1001';
  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    message = 'Database engine error';
    errorCode = 'P1010';
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    message = 'Unknown database error';
    errorCode = 'P1000';
  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    message = 'Database engine panic';
    errorCode = 'P1010';
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid access token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Access token expired';
  } else if (error.message.includes('Invalid access token') ||
             error.message.includes('Access token expired')) {
    statusCode = 401;
    message = error.message;
  } else if (error.message.includes('Invalid refresh token') ||
             error.message.includes('Refresh token expired')) {
    statusCode = 401;
    message = error.message;
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  }

  // Rate limiting errors
  if (error.message.includes('Too many requests')) {
    statusCode = 429;
    message = error.message;
  }

  // Authentication errors
  if (error.message.includes('Invalid credentials') ||
      error.message.includes('User not found')) {
    statusCode = 401;
    message = 'Invalid credentials';
  } else if (error.message.includes('User already exists with this email')) {
    statusCode = 409;
    message = 'User already exists with this email';
  }

  // Database connection specific errors
  if (error.message.includes('ECONNREFUSED') || error.message.includes('Connection refused')) {
    statusCode = 503;
    message = 'Database server is not responding';
    errorCode = 'ECONNREFUSED';
  } else if (error.message.includes('ETIMEDOUT') || error.message.includes('Connection timeout')) {
    statusCode = 504;
    message = 'Database connection timeout';
    errorCode = 'ETIMEDOUT';
  } else if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
    statusCode = 500;
    message = 'Database authentication failed';
    errorCode = 'ER_ACCESS_DENIED_ERROR';
  } else if (error.message.includes('ER_TOO_MANY_CONNECTIONS')) {
    statusCode = 503;
    message = 'Database connection limit exceeded';
    errorCode = 'ER_TOO_MANY_CONNECTIONS';
  } else if (error.message.includes('PROTOCOL_CONNECTION_LOST')) {
    statusCode = 503;
    message = 'Database connection lost';
    errorCode = 'PROTOCOL_CONNECTION_LOST';
  }

  // Don't expose internal error details in production
  if (process.env['NODE_ENV'] === 'production' && statusCode === 500) {
    message = 'Internal server error';
    errors = undefined;
  }

  const response: ApiResponse = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(errorCode && { errorCode }),
  };

  // Add correlation ID to response headers for debugging
  res.set('X-Correlation-ID', correlationId);
  res.set('X-Error-Type', error.name);
  if (errorCode) {
    res.set('X-Error-Code', errorCode);
  }

  res.status(statusCode).json(response);
};