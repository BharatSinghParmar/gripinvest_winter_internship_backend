import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import { RequestWithUser } from '../types';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const correlationId = (req as RequestWithUser).correlationId;
  
  // Capture request metadata
  const userAgent = req.get('User-Agent') || null;
  const ipAddress = req.ip || req.connection.remoteAddress || null;
  
  res.on('finish', async () => {
    try {
      const duration = Date.now() - startTime;
      const responseSize = res.get('Content-Length') ? parseInt(res.get('Content-Length') || '0', 10) : null;
      
      // Determine error code based on status code
      let errorCode: string | null = null;
      if (res.statusCode >= 400) {
        if (res.statusCode >= 500) {
          errorCode = 'SERVER_ERROR';
        } else if (res.statusCode === 401) {
          errorCode = 'UNAUTHORIZED';
        } else if (res.statusCode === 403) {
          errorCode = 'FORBIDDEN';
        } else if (res.statusCode === 404) {
          errorCode = 'NOT_FOUND';
        } else if (res.statusCode === 422) {
          errorCode = 'VALIDATION_ERROR';
        } else {
          errorCode = 'CLIENT_ERROR';
        }
      }
      
      await prisma.transaction_logs.create({
        data: {
          user_id: (req as RequestWithUser).user?.id || null,
          endpoint: req.path,
          http_method: req.method as any,
          status_code: res.statusCode,
          error_message: res.statusCode >= 400 ? res.get('X-Error-Message') || 'Unknown error' : null,
          request_duration_ms: duration,
          response_size_bytes: responseSize,
          user_agent: userAgent,
          ip_address: ipAddress,
          error_code: errorCode,
          correlation_id: correlationId || null,
        },
      });
    } catch (error) {
      // Silently fail for logging errors to avoid breaking the main application
      // Only log in development mode
      if (process.env['NODE_ENV'] === 'development') {
        console.warn('Request logging failed (non-critical):', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  });

  next();
};
