import { Request, Response, NextFunction } from 'express';

export const performanceMonitor = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const correlationId = req.headers['x-correlation-id'] || 'unknown';
    
    console.log(`[${correlationId}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // Log slow requests (>1 second)
    if (duration > 1000) {
      console.warn(`[${correlationId}] SLOW REQUEST: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
};