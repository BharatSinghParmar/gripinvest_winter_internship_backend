import { Router } from 'express';
import { 
  signup, 
  login, 
  refresh, 
  logout, 
  me, 
  requestPasswordReset, 
  resetPassword, 
  checkPasswordStrength 
} from '../controllers/authController';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { 
  signupSchema, 
  loginSchema, 
  requestPasswordResetSchema, 
  resetPasswordSchema, 
  passwordStrengthSchema 
} from '../validation/authSchemas';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

// Password reset routes
router.post('/password/otp', validate(requestPasswordResetSchema), requestPasswordReset);
router.post('/password/reset', validate(resetPasswordSchema), resetPassword);
router.post('/password/strength', validate(passwordStrengthSchema), checkPasswordStrength);

export default router;
