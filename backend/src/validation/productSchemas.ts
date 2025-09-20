import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name too long'),
  investment_type: z.enum(['bond', 'fd', 'mf', 'etf', 'other'], {
    errorMap: () => ({ message: 'Invalid investment type' })
  }),
  tenure_months: z.number().int().min(1, 'Tenure must be at least 1 month').max(360, 'Tenure cannot exceed 360 months'),
  annual_yield: z.number().min(0, 'Annual yield cannot be negative').max(100, 'Annual yield cannot exceed 100%'),
  risk_level: z.enum(['low', 'moderate', 'high'], {
    errorMap: () => ({ message: 'Invalid risk level' })
  }),
  min_investment: z.number().min(0, 'Minimum investment cannot be negative'),
  max_investment: z.number().min(0, 'Maximum investment cannot be negative').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name too long').optional(),
  investment_type: z.enum(['bond', 'fd', 'mf', 'etf', 'other'], {
    errorMap: () => ({ message: 'Invalid investment type' })
  }).optional(),
  tenure_months: z.number().int().min(1, 'Tenure must be at least 1 month').max(360, 'Tenure cannot exceed 360 months').optional(),
  annual_yield: z.number().min(0, 'Annual yield cannot be negative').max(100, 'Annual yield cannot exceed 100%').optional(),
  risk_level: z.enum(['low', 'moderate', 'high'], {
    errorMap: () => ({ message: 'Invalid risk level' })
  }).optional(),
  min_investment: z.number().min(0, 'Minimum investment cannot be negative').optional(),
  max_investment: z.number().min(0, 'Maximum investment cannot be negative').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
});

export const productFiltersSchema = z.object({
  investment_type: z.enum(['bond', 'fd', 'mf', 'etf', 'other']).optional(),
  risk_level: z.enum(['low', 'moderate', 'high']).optional(),
  min_yield: z.number().min(0).optional(),
  max_yield: z.number().min(0).optional(),
  min_tenure: z.number().int().min(1).optional(),
  max_tenure: z.number().int().min(1).optional(),
  min_investment: z.number().min(0).optional(),
  max_investment: z.number().min(0).optional(),
  search: z.string().max(100, 'Search term too long').optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const productRecommendationSchema = z.object({
  risk_appetite: z.enum(['low', 'moderate', 'high']).optional(),
  investment_amount: z.number().min(0, 'Investment amount cannot be negative').optional(),
  preferred_tenure: z.number().int().min(1).max(360).optional(),
});

export const productIdSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
});

export const generateDescriptionSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
});

export const productStatsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  include_inactive: z.boolean().default(false),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilters = z.infer<typeof productFiltersSchema>;
export type ProductRecommendationInput = z.infer<typeof productRecommendationSchema>;
export type ProductIdParams = z.infer<typeof productIdSchema>;
export type GenerateDescriptionParams = z.infer<typeof generateDescriptionSchema>;
export type ProductStatsQuery = z.infer<typeof productStatsQuerySchema>;
