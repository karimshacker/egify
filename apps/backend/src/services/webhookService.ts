import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { logger } from '@/utils/logger';
import { ApiError } from '@/utils/ApiError';
import { paymentService } from './paymentService';
import { orderService } from './orderService';
import { emailService } from './emailService';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  created: number;
  livemode: boolean;
}

export interface WebhookHealth {
  stripe: boolean;
  paypal: boolean;
  shipping: boolean;
  email: boolean;
  sms: boolean;
  analytics: boolean;
}

export const webhookService = {
  /**
   * Process Stripe webhook events
   */
  async processStripeWebhook(event: WebhookEvent, signature: string): Promise<void> {
    try {
      // Verify webhook signature
      const stripeEvent = stripe.webhooks.constructEvent(
        JSON.stringify(event),
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );

      logger.info(`Processing Stripe webhook: ${stripeEvent.type}`);

      switch (stripeEvent.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(stripeEvent.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(stripeEvent.data.object);
          break;
        case 'charge.succeeded':
          await this.handleChargeSucceeded(stripeEvent.data.object);
          break;
        case 'charge.failed':
          await this.handleChargeFailed(stripeEvent.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(stripeEvent.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(stripeEvent.data.object);
          break;
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(stripeEvent.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(stripeEvent.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(stripeEvent.data.object);
          break;
        default:
          logger.info(`Unhandled Stripe event type: ${stripeEvent.type}`);
      }
    } catch (error) {
      logger.error('Error processing Stripe webhook:', error);
      throw new ApiError(400, 'Invalid webhook signature');
    }
  },

  /**
   * Process PayPal webhook events
   */
  async processPayPalWebhook(event: any, headers: any): Promise<void> {
    try {
      logger.info(`Processing PayPal webhook: ${event.event_type}`);

      switch (event.event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePayPalPaymentCompleted(event.resource);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.handlePayPalPaymentDenied(event.resource);
          break;
        case 'PAYMENT.CAPTURE.REFUNDED':
          await this.handlePayPalPaymentRefunded(event.resource);
          break;
        default:
          logger.info(`Unhandled PayPal event type: ${event.event_type}`);
      }
    } catch (error) {
      logger.error('Error processing PayPal webhook:', error);
      throw new ApiError(400, 'Invalid PayPal webhook');
    }
  },

  /**
   * Process shipping carrier webhook events
   */
  async processShippingWebhook(event: any, headers: any): Promise<void> {
    try {
      logger.info(`Processing shipping webhook: ${event.event_type}`);

      switch (event.event_type) {
        case 'shipment.created':
          await this.handleShipmentCreated(event.data);
          break;
        case 'shipment.in_transit':
          await this.handleShipmentInTransit(event.data);
          break;
        case 'shipment.delivered':
          await this.handleShipmentDelivered(event.data);
          break;
        case 'shipment.failed':
          await this.handleShipmentFailed(event.data);
          break;
        default:
          logger.info(`Unhandled shipping event type: ${event.event_type}`);
      }
    } catch (error) {
      logger.error('Error processing shipping webhook:', error);
      throw new ApiError(400, 'Invalid shipping webhook');
    }
  },

  /**
   * Process email service webhook events
   */
  async processEmailWebhook(event: any, headers: any): Promise<void> {
    try {
      logger.info(`Processing email webhook: ${event.event_type}`);

      switch (event.event_type) {
        case 'email.sent':
          await this.handleEmailSent(event.data);
          break;
        case 'email.delivered':
          await this.handleEmailDelivered(event.data);
          break;
        case 'email.opened':
          await this.handleEmailOpened(event.data);
          break;
        case 'email.clicked':
          await this.handleEmailClicked(event.data);
          break;
        case 'email.bounced':
          await this.handleEmailBounced(event.data);
          break;
        case 'email.unsubscribed':
          await this.handleEmailUnsubscribed(event.data);
          break;
        default:
          logger.info(`Unhandled email event type: ${event.event_type}`);
      }
    } catch (error) {
      logger.error('Error processing email webhook:', error);
      throw new ApiError(400, 'Invalid email webhook');
    }
  },

  /**
   * Process SMS service webhook events
   */
  async processSMSWebhook(event: any, headers: any): Promise<void> {
    try {
      logger.info(`Processing SMS webhook: ${event.event_type}`);

      switch (event.event_type) {
        case 'sms.sent':
          await this.handleSMSSent(event.data);
          break;
        case 'sms.delivered':
          await this.handleSMSDelivered(event.data);
          break;
        case 'sms.failed':
          await this.handleSMSFailed(event.data);
          break;
        default:
          logger.info(`Unhandled SMS event type: ${event.event_type}`);
      }
    } catch (error) {
      logger.error('Error processing SMS webhook:', error);
      throw new ApiError(400, 'Invalid SMS webhook');
    }
  },

  /**
   * Process analytics service webhook events
   */
  async processAnalyticsWebhook(event: any, headers: any): Promise<void> {
    try {
      logger.info(`Processing analytics webhook: ${event.event_type}`);

      switch (event.event_type) {
        case 'page_view':
          await this.handlePageView(event.data);
          break;
        case 'purchase':
          await this.handlePurchase(event.data);
          break;
        case 'add_to_cart':
          await this.handleAddToCart(event.data);
          break;
        default:
          logger.info(`Unhandled analytics event type: ${event.event_type}`);
      }
    } catch (error) {
      logger.error('Error processing analytics webhook:', error);
      throw new ApiError(400, 'Invalid analytics webhook');
    }
  },

  /**
   * Process custom webhook events
   */
  async processCustomWebhook(event: any, headers: any, webhookType?: string): Promise<void> {
    try {
      logger.info(`Processing custom webhook: ${webhookType} - ${event.event_type}`);

      // Handle custom webhook logic based on type
      switch (webhookType) {
        case 'inventory':
          await this.handleInventoryWebhook(event);
          break;
        case 'customer':
          await this.handleCustomerWebhook(event);
          break;
        case 'product':
          await this.handleProductWebhook(event);
          break;
        default:
          logger.info(`Unhandled custom webhook type: ${webhookType}`);
      }
    } catch (error) {
      logger.error('Error processing custom webhook:', error);
      throw new ApiError(400, 'Invalid custom webhook');
    }
  },

  /**
   * Get webhook health status
   */
  async getHealthStatus(): Promise<WebhookHealth> {
    const health: WebhookHealth = {
      stripe: true,
      paypal: true,
      shipping: true,
      email: true,
      sms: true,
      analytics: true,
    };

    return health;
  },

  // Stripe webhook handlers
  private async handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
    const orderId = paymentIntent.metadata?.orderId;
    if (orderId) {
      await orderService.updateOrderPaymentStatus(orderId, 'PAID');
      await paymentService.updatePaymentStatus(paymentIntent.id, 'PAID');
    }
  },

  private async handlePaymentIntentFailed(paymentIntent: any): Promise<void> {
    const orderId = paymentIntent.metadata?.orderId;
    if (orderId) {
      await orderService.updateOrderPaymentStatus(orderId, 'FAILED');
      await paymentService.updatePaymentStatus(paymentIntent.id, 'FAILED');
    }
  },

  private async handleChargeSucceeded(charge: any): Promise<void> {
    logger.info(`Charge succeeded: ${charge.id}`);
  },

  private async handleChargeFailed(charge: any): Promise<void> {
    logger.info(`Charge failed: ${charge.id}`);
  },

  private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    logger.info(`Invoice payment succeeded: ${invoice.id}`);
  },

  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    logger.info(`Invoice payment failed: ${invoice.id}`);
  },

  private async handleSubscriptionCreated(subscription: any): Promise<void> {
    logger.info(`Subscription created: ${subscription.id}`);
  },

  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    logger.info(`Subscription updated: ${subscription.id}`);
  },

  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    logger.info(`Subscription deleted: ${subscription.id}`);
  },

  // PayPal webhook handlers
  private async handlePayPalPaymentCompleted(payment: any): Promise<void> {
    logger.info(`PayPal payment completed: ${payment.id}`);
  },

  private async handlePayPalPaymentDenied(payment: any): Promise<void> {
    logger.info(`PayPal payment denied: ${payment.id}`);
  },

  private async handlePayPalPaymentRefunded(payment: any): Promise<void> {
    logger.info(`PayPal payment refunded: ${payment.id}`);
  },

  // Shipping webhook handlers
  private async handleShipmentCreated(shipment: any): Promise<void> {
    logger.info(`Shipment created: ${shipment.id}`);
  },

  private async handleShipmentInTransit(shipment: any): Promise<void> {
    logger.info(`Shipment in transit: ${shipment.id}`);
  },

  private async handleShipmentDelivered(shipment: any): Promise<void> {
    logger.info(`Shipment delivered: ${shipment.id}`);
  },

  private async handleShipmentFailed(shipment: any): Promise<void> {
    logger.info(`Shipment failed: ${shipment.id}`);
  },

  // Email webhook handlers
  private async handleEmailSent(email: any): Promise<void> {
    logger.info(`Email sent: ${email.id}`);
  },

  private async handleEmailDelivered(email: any): Promise<void> {
    logger.info(`Email delivered: ${email.id}`);
  },

  private async handleEmailOpened(email: any): Promise<void> {
    logger.info(`Email opened: ${email.id}`);
  },

  private async handleEmailClicked(email: any): Promise<void> {
    logger.info(`Email clicked: ${email.id}`);
  },

  private async handleEmailBounced(email: any): Promise<void> {
    logger.info(`Email bounced: ${email.id}`);
  },

  private async handleEmailUnsubscribed(email: any): Promise<void> {
    logger.info(`Email unsubscribed: ${email.id}`);
  },

  // SMS webhook handlers
  private async handleSMSSent(sms: any): Promise<void> {
    logger.info(`SMS sent: ${sms.id}`);
  },

  private async handleSMSDelivered(sms: any): Promise<void> {
    logger.info(`SMS delivered: ${sms.id}`);
  },

  private async handleSMSFailed(sms: any): Promise<void> {
    logger.info(`SMS failed: ${sms.id}`);
  },

  // Analytics webhook handlers
  private async handlePageView(data: any): Promise<void> {
    logger.info(`Page view: ${data.url}`);
  },

  private async handlePurchase(data: any): Promise<void> {
    logger.info(`Purchase: ${data.orderId}`);
  },

  private async handleAddToCart(data: any): Promise<void> {
    logger.info(`Add to cart: ${data.productId}`);
  },

  // Custom webhook handlers
  private async handleInventoryWebhook(event: any): Promise<void> {
    logger.info(`Inventory webhook: ${event.event_type}`);
  },

  private async handleCustomerWebhook(event: any): Promise<void> {
    logger.info(`Customer webhook: ${event.event_type}`);
  },

  private async handleProductWebhook(event: any): Promise<void> {
    logger.info(`Product webhook: ${event.event_type}`);
  },
}; 