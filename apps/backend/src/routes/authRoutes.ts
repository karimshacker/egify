import { Router } from 'express';
import { authController } from '@/controllers/authController';
import { authenticate, optionalAuth } from '@/middleware/auth';
import { 
  validateUserRegistration, 
  validateUserLogin, 
  validateUserUpdate,
  validatePasswordChange,
  validatePasswordReset
} from '@/middleware/validation';

const router = Router();

// Public routes
router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateUserLogin, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', validatePasswordReset, authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Protected routes
router.use(authenticate);
router.post('/logout', authController.logout);
router.get('/me', authController.getProfile);
router.put('/profile', validateUserUpdate, authController.updateProfile);
router.put('/change-password', validatePasswordChange, authController.changePassword);

export default router; 