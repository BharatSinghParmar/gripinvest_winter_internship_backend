import { Router } from 'express';
import securityRoutes from './auth';
import healthRoutes from './health';
import instrumentRoutes from './products';
import wealthRoutes from './investments';
import loggingRoutes from './logging';

const router = Router();

router.use('/security', securityRoutes);
router.use('/health', healthRoutes);
router.use('/instruments', instrumentRoutes);
router.use('/wealth', wealthRoutes);
router.use('/logging', loggingRoutes);

export default router;
