import { Router } from 'express';
import {
  getDatabaseHealth,
  testDatabaseConnectivity,
  getDatabasePerformance,
  getDatabaseSchema,
  diagnoseDatabaseError,
  getDatabaseSnapshot,
  getConnectionPoolStatus,
  getSlowQueries,
  getBufferPoolAnalysis,
} from '../controllers/databaseController';

const router = Router();

// Database health and monitoring routes
router.get('/health', getDatabaseHealth);
router.get('/connectivity', testDatabaseConnectivity);
router.get('/performance', getDatabasePerformance);
router.get('/schema', getDatabaseSchema);
router.get('/snapshot', getDatabaseSnapshot);
router.get('/connection-pool', getConnectionPoolStatus);
router.get('/slow-queries', getSlowQueries);
router.get('/buffer-pool', getBufferPoolAnalysis);

// Database error diagnosis route
router.get('/diagnose/:errorCode', diagnoseDatabaseError);

export default router;
