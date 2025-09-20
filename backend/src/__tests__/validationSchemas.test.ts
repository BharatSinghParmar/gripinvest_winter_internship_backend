import { 
  productIdSchema, 
  generateDescriptionSchema, 
  productStatsQuerySchema 
} from '../validation/productSchemas';
import {
  transactionLogsQuerySchema,
  performanceMetricsQuerySchema,
  slowestEndpointsQuerySchema,
  errorProneEndpointsQuerySchema,
  performanceTrendsQuerySchema,
  errorAnalysisQuerySchema,
  auditTrailQuerySchema,
  auditStatisticsQuerySchema,
  userIdParamsSchema,
  resourceAuditTrailParamsSchema,
  exportLogsQuerySchema,
  databaseMetricsQuerySchema,
} from '../validation/loggingSchemas';

describe('New Validation Schemas', () => {
  describe('Product Validation Schemas', () => {
    describe('productIdSchema', () => {
      it('should validate correct UUID', () => {
        const validData = { id: '123e4567-e89b-12d3-a456-426614174000' };
        const result = productIdSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid UUID format', () => {
        const invalidData = { id: 'invalid-uuid' };
        const result = productIdSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('Invalid product ID format');
        }
      });

      it('should reject missing id', () => {
        const invalidData = {};
        const result = productIdSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('generateDescriptionSchema', () => {
      it('should validate correct UUID', () => {
        const validData = { id: '123e4567-e89b-12d3-a456-426614174000' };
        const result = generateDescriptionSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid UUID format', () => {
        const invalidData = { id: 'not-a-uuid' };
        const result = generateDescriptionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('productStatsQuerySchema', () => {
      it('should validate with defaults', () => {
        const validData = {};
        const result = productStatsQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.period).toBe('30d');
          expect(result.data.include_inactive).toBe(false);
        }
      });

      it('should validate with custom values', () => {
        const validData = { period: '7d', include_inactive: true };
        const result = productStatsQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.period).toBe('7d');
          expect(result.data.include_inactive).toBe(true);
        }
      });

      it('should reject invalid period', () => {
        const invalidData = { period: 'invalid' };
        const result = productStatsQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject invalid include_inactive type', () => {
        const invalidData = { include_inactive: 'yes' };
        const result = productStatsQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Logging Validation Schemas', () => {
    describe('transactionLogsQuerySchema', () => {
      it('should validate with defaults', () => {
        const validData = {};
        const result = transactionLogsQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.pageSize).toBe(50);
        }
      });

      it('should validate with all parameters', () => {
        const validData = {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          endpoint: '/api/test',
          http_method: 'GET',
          status_code: 200,
          error_code: 'VALIDATION_ERROR',
          from: '2023-01-01T00:00:00Z',
          to: '2023-12-31T23:59:59Z',
          page: 2,
          pageSize: 25
        };
        const result = transactionLogsQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid email', () => {
        const invalidData = { email: 'invalid-email' };
        const result = transactionLogsQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject invalid UUID', () => {
        const invalidData = { user_id: 'invalid-uuid' };
        const result = transactionLogsQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject invalid HTTP method', () => {
        const invalidData = { http_method: 'INVALID' };
        const result = transactionLogsQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject invalid status code', () => {
        const invalidData = { status_code: 999 };
        const result = transactionLogsQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject invalid date format', () => {
        const invalidData = { from: 'invalid-date' };
        const result = transactionLogsQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject page size too large', () => {
        const invalidData = { pageSize: 200 };
        const result = transactionLogsQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('performanceMetricsQuerySchema', () => {
      it('should validate with defaults', () => {
        const validData = {};
        const result = performanceMetricsQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.period).toBe('24h');
        }
      });

      it('should validate with custom values', () => {
        const validData = { period: '7d', endpoint: '/api/products' };
        const result = performanceMetricsQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid period', () => {
        const invalidData = { period: 'invalid' };
        const result = performanceMetricsQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('slowestEndpointsQuerySchema', () => {
      it('should validate with defaults', () => {
        const validData = {};
        const result = slowestEndpointsQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(10);
          expect(result.data.period).toBe('24h');
          expect(result.data.min_requests).toBe(5);
        }
      });

      it('should reject limit too high', () => {
        const invalidData = { limit: 200 };
        const result = slowestEndpointsQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('errorProneEndpointsQuerySchema', () => {
      it('should validate with defaults', () => {
        const validData = {};
        const result = errorProneEndpointsQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject negative min_requests', () => {
        const invalidData = { min_requests: -1 };
        const result = errorProneEndpointsQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('performanceTrendsQuerySchema', () => {
      it('should validate with defaults', () => {
        const validData = {};
        const result = performanceTrendsQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.period).toBe('30d');
          expect(result.data.metric).toBe('response_time');
        }
      });

      it('should reject invalid metric', () => {
        const invalidData = { metric: 'invalid' };
        const result = performanceTrendsQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('errorAnalysisQuerySchema', () => {
      it('should validate with defaults', () => {
        const validData = {};
        const result = errorAnalysisQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.period).toBe('24h');
          expect(result.data.error_type).toBe('all');
        }
      });

      it('should reject invalid error_type', () => {
        const invalidData = { error_type: 'invalid' };
        const result = errorAnalysisQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('auditTrailQuerySchema', () => {
      it('should validate with defaults', () => {
        const validData = {};
        const result = auditTrailQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.pageSize).toBe(50);
        }
      });

      it('should validate with all parameters', () => {
        const validData = {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          action: 'CREATE',
          resource_type: 'PRODUCT',
          resource_id: 'prod-123',
          from: '2023-01-01T00:00:00Z',
          to: '2023-12-31T23:59:59Z',
          page: 1,
          pageSize: 25
        };
        const result = auditTrailQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe('auditStatisticsQuerySchema', () => {
      it('should validate with defaults', () => {
        const validData = {};
        const result = auditStatisticsQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.period).toBe('7d');
          expect(result.data.group_by).toBe('action');
        }
      });

      it('should reject invalid group_by', () => {
        const invalidData = { group_by: 'invalid' };
        const result = auditStatisticsQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('userIdParamsSchema', () => {
      it('should validate correct UUID', () => {
        const validData = { userId: '123e4567-e89b-12d3-a456-426614174000' };
        const result = userIdParamsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid UUID', () => {
        const invalidData = { userId: 'invalid' };
        const result = userIdParamsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('resourceAuditTrailParamsSchema', () => {
      it('should validate correct parameters', () => {
        const validData = { resourceType: 'PRODUCT', resourceId: 'prod-123' };
        const result = resourceAuditTrailParamsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject empty resource type', () => {
        const invalidData = { resourceType: '', resourceId: 'prod-123' };
        const result = resourceAuditTrailParamsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject empty resource ID', () => {
        const invalidData = { resourceType: 'PRODUCT', resourceId: '' };
        const result = resourceAuditTrailParamsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('exportLogsQuerySchema', () => {
      it('should validate with defaults', () => {
        const validData = {};
        const result = exportLogsQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.format).toBe('json');
        }
      });

      it('should validate with all parameters', () => {
        const validData = {
          format: 'csv',
          from: '2023-01-01T00:00:00Z',
          to: '2023-12-31T23:59:59Z',
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          endpoint: '/api/products'
        };
        const result = exportLogsQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid format', () => {
        const invalidData = { format: 'pdf' };
        const result = exportLogsQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('databaseMetricsQuerySchema', () => {
      it('should validate with defaults', () => {
        const validData = {};
        const result = databaseMetricsQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.period).toBe('24h');
          expect(result.data.metric).toBe('all');
        }
      });

      it('should reject invalid metric', () => {
        const invalidData = { metric: 'invalid' };
        const result = databaseMetricsQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });
});
