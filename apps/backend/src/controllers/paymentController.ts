import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { 
  validatePaymentIntent,
  validateRefundRequest
} from '@/middleware/validation';
import { paymentService } from '@/services/paymentService';

export class PaymentController {
  /**
   * Create payment intent
   * POST /api/payments/create-intent
   */
  createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
    const { amount, currency, orderId, paymentMethod, customerId } = req.body;
    
    const paymentIntent = await paymentService.createPaymentIntent({
      amount,
      currency,
      orderId,
      customerId,
      paymentMethod,
    });
    
    res.status(200).json({
      success: true,
      data: paymentIntent
    });
  });

  /**
   * Confirm payment
   * POST /api/payments/confirm
   */
  confirmPayment = asyncHandler(async (req: Request, res: Response) => {
    const { paymentIntentId, paymentMethodId } = req.body;
    
    const paymentIntent = await paymentService.confirmPaymentIntent(paymentIntentId, paymentMethodId);
    
    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: paymentIntent
    });
  });

  /**
   * Process refund
   * POST /api/payments/refund
   */
  processRefund = asyncHandler(async (req: Request, res: Response) => {
    const { paymentIntentId, amount, reason } = req.body;
    
    const refund = await paymentService.processRefund({
      paymentIntentId,
      amount,
      reason,
    });
    
    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: refund
    });
  });

  /**
   * Get payment methods
   * GET /api/payments/methods
   */
  getPaymentMethods = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.user?.id;
    
    const paymentMethods = await paymentService.getPaymentMethods(customerId);
    
    res.status(200).json({
      success: true,
      data: paymentMethods
    });
  });

  /**
   * Add payment method
   * POST /api/payments/methods
   */
  addPaymentMethod = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.user?.id;
    const { paymentMethodId } = req.body;
    
    const paymentMethod = await paymentService.addPaymentMethod(customerId, paymentMethodId);
    
    res.status(200).json({
      success: true,
      message: 'Payment method added successfully',
      data: paymentMethod
    });
  });

  /**
   * Remove payment method
   * DELETE /api/payments/methods/:id
   */
  removePaymentMethod = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.user?.id;
    const paymentMethodId = req.params.id;
    
    const paymentMethod = await paymentService.removePaymentMethod(paymentMethodId);
    
    res.status(200).json({
      success: true,
      message: 'Payment method removed successfully',
      data: paymentMethod
    });
  });

  /**
   * Get payment history
   * GET /api/payments/history
   */
  getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;
    
    const result = await paymentService.getPaymentHistory(
      customerId,
      Number(page),
      Number(limit)
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  });

  /**
   * Webhook handler for payment events
   * POST /api/payments/webhook
   */
  handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const payload = JSON.stringify(req.body);
    
    try {
      const event = paymentService.verifyWebhookSignature(payload, sig);
      await paymentService.handleWebhookEvent(event);
      
      logger.info('Payment webhook processed successfully:', event.type);
      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Webhook error:', error);
      res.status(400).json({ error: 'Webhook signature verification failed' });
    }
  });
}

export const paymentController = new PaymentController(); 