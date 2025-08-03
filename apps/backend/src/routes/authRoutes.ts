import { Router } from 'express';
import { authController } from '@/controllers/authController';
import { authenticate, optionalAuth } from '@/middleware/auth';
import { validateRequest } from '@/validations';
import { authValidation } from '@/validations/authValidation';

const router = Router();

// Public routes
router.post('/register', validateRequest(authValidation.register), authController.register);
router.post('/login', validateRequest(authValidation.login), authController.login);
router.post('/refresh', validateRequest(authValidation.refreshToken), authController.refreshToken);
router.post('/forgot-password', validateRequest(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validateRequest(authValidation.resetPassword), authController.resetPassword);
router.post('/verify-email', validateRequest(authValidation.verifyEmail), authController.verifyEmail);
router.post('/resend-verification', validateRequest(authValidation.resendVerification), authController.resendVerification);

// Protected routes
router.use(authenticate);
router.post('/logout', authController.logout);
router.get('/me', authController.getProfile);
router.put('/profile', validateRequest(authValidation.updateProfile), authController.updateProfile);
router.put('/change-password', validateRequest(authValidation.changePassword), authController.changePassword);

export default router; 