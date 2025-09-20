import { z } from 'zod';

export const createInvestmentSchema = z.object({
  product_id: z.string().min(1, 'product_id is required'),
  amount: z.number().positive('amount must be positive').min(1000, 'Minimum amount is 1000'),
});

export const investmentFiltersSchema = z.object({
  status: z.enum(['active', 'matured', 'cancelled']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const portfolioInsightsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
export type InvestmentFilters = z.infer<typeof investmentFiltersSchema>;
export type PortfolioInsightsQuery = z.infer<typeof portfolioInsightsQuerySchema>;
