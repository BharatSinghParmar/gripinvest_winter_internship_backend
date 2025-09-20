// Unit tests for middleware functions
import { describe, it, expect, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { v4 as uuidv4 } from 'uuid';

describe('Async Handler Middleware', () => {
  it('should handle async function without errors', async () => {
    const mockReq = {} as Request;
    const mockRes = {} as Response;
    const mockNext = jest.fn() as NextFunction;

    const asyncFn = async (_req: Request, _res: Response) => {
      // Test function that returns success
    };

    const wrappedFn = asyncHandler(asyncFn);
    
    await wrappedFn(mockReq, mockRes, mockNext);
    
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle async function with errors', async () => {
    const mockReq = {} as Request;
    const mockRes = {} as Response;
    const mockNext = jest.fn() as NextFunction;

    const asyncFn = async (_req: Request, _res: Response) => {
      throw new Error('Test error');
    };

    const wrappedFn = asyncHandler(asyncFn);
    
    await wrappedFn(mockReq, mockRes, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('Correlation ID Middleware', () => {
  it('should generate correlation ID', () => {
    const correlationId = uuidv4();
    
    expect(correlationId).toBeDefined();
    expect(typeof correlationId).toBe('string');
    expect(correlationId.length).toBeGreaterThan(0);
  });

  it('should generate unique correlation IDs', () => {
    const id1 = uuidv4();
    const id2 = uuidv4();
    
    expect(id1).not.toBe(id2);
  });
});
