import { Router } from 'express';
import { webhookController } from '@/controllers/webhookController';
import { validateWebhookSignature } from '@/middleware/webhookSignature';

const router = Router();

/**
 * @swagger
 * /api/webhooks/stripe:
 *   post:
 *     summary: Handle Stripe webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 */
router.post('/stripe', validateWebhookSignature('stripe'), webhookController.handleStripeWebhook);

/**
 * @swagger
 * /api/webhooks/paypal:
 *   post:
 *     summary: Handle PayPal webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 */
router.post('/paypal', validateWebhookSignature('paypal'), webhookController.handlePayPalWebhook);

/**
 * @swagger
 * /api/webhooks/shipping:
 *   post:
 *     summary: Handle shipping carrier webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 */
router.post('/shipping', validateWebhookSignature('shipping'), webhookController.handleShippingWebhook);

/**
 * @swagger
 * /api/webhooks/email:
 *   post:
 *     summary: Handle email service webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 */
router.post('/email', validateWebhookSignature('email'), webhookController.handleEmailWebhook);

/**
 * @swagger
 * /api/webhooks/sms:
 *   post:
 *     summary: Handle SMS service webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 */
router.post('/sms', validateWebhookSignature('sms'), webhookController.handleSMSWebhook);

/**
 * @swagger
 * /api/webhooks/analytics:
 *   post:
 *     summary: Handle analytics service webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 */
router.post('/analytics', validateWebhookSignature('analytics'), webhookController.handleAnalyticsWebhook);

/**
 * @swagger
 * /api/webhooks/custom:
 *   post:
 *     summary: Handle custom webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 */
router.post('/custom', validateWebhookSignature('custom'), webhookController.handleCustomWebhook);

/**
 * @swagger
 * /api/webhooks/health:
 *   get:
 *     summary: Webhook health check
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Webhook service is healthy
 */
router.get('/health', webhookController.healthCheck);

export default router; 