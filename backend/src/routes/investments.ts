import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createInvestment } from '../controllers/investmentController';
import { listMyInvestments } from '../controllers/investmentController';
import { portfolioInsights } from '../controllers/investmentController';
import { createInvestmentSchema, investmentFiltersSchema, portfolioInsightsQuerySchema } from '../validation/investmentSchemas';

const router = Router();

router.post('/', authenticate, validate(createInvestmentSchema), createInvestment);
router.get('/me', authenticate, validate(investmentFiltersSchema), listMyInvestments);
router.get('/portfolio/insights', authenticate, validate(portfolioInsightsQuerySchema), portfolioInsights);

export default router;
