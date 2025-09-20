import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getProductRecommendations,
  createProduct,
  updateProduct,
  deleteProduct,
  generateProductDescription,
  getProductStats,
} from '../controllers/productController';
import { validate, validateParams } from '../middleware/validate';
import { authenticate, requireRole } from '../middleware/auth';
import {
  createProductSchema,
  updateProductSchema,
  productFiltersSchema,
  productRecommendationSchema,
  productIdSchema,
  generateDescriptionSchema,
  productStatsQuerySchema,
} from '../validation/productSchemas';

const router = Router();

// Public routes (no authentication required)
router.get('/', validate(productFiltersSchema), getProducts);
router.get('/:id', validateParams(productIdSchema), getProductById);

// User routes (authentication required)
router.get('/recommendations/me', authenticate, validate(productRecommendationSchema), getProductRecommendations);

// Admin routes (admin role required)
router.post('/', authenticate, requireRole('admin'), validate(createProductSchema), createProduct);
router.put('/:id', authenticate, requireRole('admin'), validateParams(productIdSchema), validate(updateProductSchema), updateProduct);
router.delete('/:id', authenticate, requireRole('admin'), validateParams(productIdSchema), deleteProduct);
router.post('/:id/description/ai', authenticate, requireRole('admin'), validateParams(generateDescriptionSchema), generateProductDescription);
router.get('/admin/stats', authenticate, requireRole('admin'), validate(productStatsQuerySchema), getProductStats);

export default router;
