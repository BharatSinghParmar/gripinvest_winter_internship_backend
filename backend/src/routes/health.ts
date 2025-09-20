import { Router } from 'express';
import { health, detailedHealth } from '../controllers/healthController';

const router = Router();

router.get('/', health);
router.get('/detailed', detailedHealth);

export default router;
