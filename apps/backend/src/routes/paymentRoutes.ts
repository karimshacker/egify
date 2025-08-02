import { Router } from 'express';
import { paymentController } from '@/controllers/paymentController';
import { authenticate } from '@/middleware/auth';
import { 
  validatePaymentIntent,
  validateRefundRequest
} from '@/middleware/validation';

const router = Router();

// Public routes (webhooks)
router.post('/webhook', paymentController.handleWebhook);

// Protected routes
router.use(authenticate);

// Payment processing
router.post('/create-intent', validatePaymentIntent, paymentController.createPaymentIntent);
router.post('/confirm', paymentController.confirmPayment);
router.post('/refund', validateRefundRequest, paymentController.processRefund);

// Payment methods
router.get('/methods', paymentController.getPaymentMethods);
router.post('/methods', paymentController.addPaymentMethod);
router.delete('/methods/:id', paymentController.removePaymentMethod);

// Payment history
router.get('/history', paymentController.getPaymentHistory);

export default router; 