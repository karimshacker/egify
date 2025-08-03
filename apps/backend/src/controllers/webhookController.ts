import { Request, Response } from 'express';
import { webhookService } from '@/services/webhookService';
import { logger } from '@/utils/logger';
import { catchAsync } from '@/utils/catchAsync';

export const webhookController = {
  /**
   * Handle Stripe webhooks
   */
  handleStripeWebhook: catchAsync(async (req: Request, res: Response) => {
    const event = req.body;
    const signature = req.headers['stripe-signature'] as string;

    await webhookService.processStripeWebhook(event, signature);

    res.status(200).json({ received: true });
  }),

  /**
   * Handle PayPal webhooks
   */
  handlePayPalWebhook: catchAsync(async (req: Request, res: Response) => {
    const event = req.body;
    const headers = req.headers;

    await webhookService.processPayPalWebhook(event, headers);

    res.status(200).json({ received: true });
  }),

  /**
   * Handle shipping carrier webhooks
   */
  handleShippingWebhook: catchAsync(async (req: Request, res: Response) => {
    const event = req.body;
    const headers = req.headers;

    await webhookService.processShippingWebhook(event, headers);

    res.status(200).json({ received: true });
  }),

  /**
   * Handle email service webhooks
   */
  handleEmailWebhook: catchAsync(async (req: Request, res: Response) => {
    const event = req.body;
    const headers = req.headers;

    await webhookService.processEmailWebhook(event, headers);

    res.status(200).json({ received: true });
  }),

  /**
   * Handle SMS service webhooks
   */
  handleSMSWebhook: catchAsync(async (req: Request, res: Response) => {
    const event = req.body;
    const headers = req.headers;

    await webhookService.processSMSWebhook(event, headers);

    res.status(200).json({ received: true });
  }),

  /**
   * Handle analytics service webhooks
   */
  handleAnalyticsWebhook: catchAsync(async (req: Request, res: Response) => {
    const event = req.body;
    const headers = req.headers;

    await webhookService.processAnalyticsWebhook(event, headers);

    res.status(200).json({ received: true });
  }),

  /**
   * Handle custom webhooks
   */
  handleCustomWebhook: catchAsync(async (req: Request, res: Response) => {
    const event = req.body;
    const headers = req.headers;
    const webhookType = req.query.type as string;

    await webhookService.processCustomWebhook(event, headers, webhookType);

    res.status(200).json({ received: true });
  }),

  /**
   * Webhook health check
   */
  healthCheck: catchAsync(async (req: Request, res: Response) => {
    const health = await webhookService.getHealthStatus();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: health,
    });
  }),
}; 