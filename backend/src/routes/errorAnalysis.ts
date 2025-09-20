import { Router } from 'express';
import {
  getErrorAnalysis,
  getErrorStatistics,
  createErrorReport,
  getErrorPatterns,
  getTopErrors,
  getAffectedEndpoints,
  getErrorTimeDistribution,
  getErrorRecommendations,
} from '../controllers/errorAnalysisController';

const router = Router();

// Error analysis routes
router.get('/analysis', getErrorAnalysis);
router.get('/statistics', getErrorStatistics);
router.get('/report', createErrorReport);
router.get('/patterns', getErrorPatterns);
router.get('/top-errors', getTopErrors);
router.get('/affected-endpoints', getAffectedEndpoints);
router.get('/time-distribution', getErrorTimeDistribution);
router.get('/recommendations', getErrorRecommendations);

export default router;
