import { Router } from 'express';
import {
  getTransactionLogs,
  getPerformanceMetrics,
  getSlowestEndpoints,
  getErrorProneEndpoints,
  getPerformanceTrends,
  getErrorAnalysis,
  getAuditTrail,
  getAuditStatistics,
  getUserAuditTrail,
  getResourceAuditTrail,
  getDatabaseMetrics,
  exportLogs,
} from '../controllers/loggingController';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
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

const router = Router();

// All logging routes require authentication
router.use(authenticate);

// Transaction logs - Admin only
router.get('/transaction-logs', requireRole('admin'), validate(transactionLogsQuerySchema), getTransactionLogs);

// Performance metrics - Admin only
router.get('/performance/metrics', requireRole('admin'), validate(performanceMetricsQuerySchema), getPerformanceMetrics);
router.get('/performance/slowest-endpoints', requireRole('admin'), validate(slowestEndpointsQuerySchema), getSlowestEndpoints);
router.get('/performance/error-prone-endpoints', requireRole('admin'), validate(errorProneEndpointsQuerySchema), getErrorProneEndpoints);
router.get('/performance/trends', requireRole('admin'), validate(performanceTrendsQuerySchema), getPerformanceTrends);
router.get('/performance/database', requireRole('admin'), validate(databaseMetricsQuerySchema), getDatabaseMetrics);

// Error analysis - Admin only
router.get('/error-analysis', requireRole('admin'), validate(errorAnalysisQuerySchema), getErrorAnalysis);

// Audit trail - Admin only
router.get('/audit-trail', requireRole('admin'), validate(auditTrailQuerySchema), getAuditTrail);
router.get('/audit-statistics', requireRole('admin'), validate(auditStatisticsQuerySchema), getAuditStatistics);
router.get('/audit-trail/user/:userId', requireRole('admin'), validate(userIdParamsSchema), getUserAuditTrail);
router.get('/audit-trail/resource/:resourceType/:resourceId', requireRole('admin'), validate(resourceAuditTrailParamsSchema), getResourceAuditTrail);

// Export logs - Admin only
router.get('/export', requireRole('admin'), validate(exportLogsQuerySchema), exportLogs);

export default router;
