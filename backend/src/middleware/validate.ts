import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ApiResponse } from '../types';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        };
        res.status(400).json(response);
        return;
      }
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        };
        res.status(400).json(response);
        return;
      }
      next(error);
    }
  };
};