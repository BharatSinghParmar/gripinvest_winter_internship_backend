import { z } from 'zod';

export const transactionLogsQuerySchema = z.object({
  user_id: z.string().uuid('Invalid user ID format').optional(),
  email: z.string().email('Invalid email format').optional(),
  endpoint: z.string().max(255, 'Endpoint too long').optional(),
  http_method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional(),
  status_code: z.number().int().min(100).max(599).optional(),
  error_code: z.string().max(50, 'Error code too long').optional(),
  from: z.string().datetime('Invalid from date format').optional(),
  to: z.string().datetime('Invalid to date format').optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

export const performanceMetricsQuerySchema = z.object({
  period: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  endpoint: z.string().max(255, 'Endpoint too long').optional(),
});

export const slowestEndpointsQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
  period: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  min_requests: z.number().int().min(1).default(5),
});

export const errorProneEndpointsQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
  period: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  min_requests: z.number().int().min(1).default(5),
});

export const performanceTrendsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
  metric: z.enum(['response_time', 'throughput', 'error_rate']).default('response_time'),
});

export const errorAnalysisQuerySchema = z.object({
  period: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  error_type: z.enum(['all', '4xx', '5xx']).default('all'),
  user_id: z.string().uuid('Invalid user ID format').optional(),
});

export const auditTrailQuerySchema = z.object({
  user_id: z.string().uuid('Invalid user ID format').optional(),
  action: z.string().max(100, 'Action too long').optional(),
  resource_type: z.string().max(100, 'Resource type too long').optional(),
  resource_id: z.string().max(100, 'Resource ID too long').optional(),
  from: z.string().datetime('Invalid from date format').optional(),
  to: z.string().datetime('Invalid to date format').optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

export const auditStatisticsQuerySchema = z.object({
  period: z.enum(['24h', '7d', '30d']).default('7d'),
  group_by: z.enum(['user', 'action', 'resource_type']).default('action'),
});

export const userIdParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

export const resourceAuditTrailParamsSchema = z.object({
  resourceType: z.string().min(1, 'Resource type is required').max(100, 'Resource type too long'),
  resourceId: z.string().min(1, 'Resource ID is required').max(100, 'Resource ID too long'),
});

export const exportLogsQuerySchema = z.object({
  format: z.enum(['json', 'csv', 'xlsx']).default('json'),
  from: z.string().datetime('Invalid from date format').optional(),
  to: z.string().datetime('Invalid to date format').optional(),
  user_id: z.string().uuid('Invalid user ID format').optional(),
  endpoint: z.string().max(255, 'Endpoint too long').optional(),
});

export const databaseMetricsQuerySchema = z.object({
  period: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  metric: z.enum(['all', 'connections', 'queries', 'performance']).default('all'),
});

export type TransactionLogsQuery = z.infer<typeof transactionLogsQuerySchema>;
export type PerformanceMetricsQuery = z.infer<typeof performanceMetricsQuerySchema>;
export type SlowestEndpointsQuery = z.infer<typeof slowestEndpointsQuerySchema>;
export type ErrorProneEndpointsQuery = z.infer<typeof errorProneEndpointsQuerySchema>;
export type PerformanceTrendsQuery = z.infer<typeof performanceTrendsQuerySchema>;
export type ErrorAnalysisQuery = z.infer<typeof errorAnalysisQuerySchema>;
export type AuditTrailQuery = z.infer<typeof auditTrailQuerySchema>;
export type AuditStatisticsQuery = z.infer<typeof auditStatisticsQuerySchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type ResourceAuditTrailParams = z.infer<typeof resourceAuditTrailParamsSchema>;
export type ExportLogsQuery = z.infer<typeof exportLogsQuerySchema>;
export type DatabaseMetricsQuery = z.infer<typeof databaseMetricsQuerySchema>;
