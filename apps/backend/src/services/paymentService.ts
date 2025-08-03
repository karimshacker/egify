import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

export interface PaymentIntentData {
  amount: number;
  currency: string;
  orderId: string;
  customerId: string;
  paymentMethod?: string;
  metadata?: Record<string, string>;
}

export interface RefundData {
  paymentIntentId: string;
  amount?: number;
  reason: string;
  metadata?: Record<string, string>;
}

export interface PaymentMethodData {
  type: string;
  card?: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  };
  billing_details?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
}

export class PaymentService {
  private stripe: Stripe;
  private prisma: PrismaClient;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
    this.prisma = new PrismaClient();
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(data: PaymentIntentData): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency,
        customer: data.customerId,
        payment_method: data.paymentMethod,
        metadata: {
          orderId: data.orderId,
          ...data.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Store payment record in database
      await this.prisma.payment.create({
        data: {
          id: paymentIntent.id,
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency,
          status: paymentIntent.status as any,
          paymentMethod: 'stripe',
          customerId: data.customerId,
          metadata: paymentIntent.metadata,
        },
      });

      logger.info(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      // Update payment record in database
      await this.prisma.payment.update({
        where: { id: paymentIntentId },
        data: {
          status: paymentIntent.status as any,
          updatedAt: new Date(),
        },
      });

      logger.info(`Payment intent confirmed: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Error confirming payment intent:', error);
      throw error;
    }
  }

  /**
   * Process a refund
   */
  async processRefund(data: RefundData): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: data.paymentIntentId,
        amount: data.amount,
        reason: data.reason as any,
        metadata: data.metadata,
      });

      // Update payment record in database
      await this.prisma.payment.update({
        where: { id: data.paymentIntentId },
        data: {
          status: 'refunded',
          updatedAt: new Date(),
        },
      });

      logger.info(`Refund processed: ${refund.id}`);
      return refund;
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get payment methods for a customer
   */
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('Error getting payment methods:', error);
      throw error;
    }
  }

  /**
   * Add a payment method to a customer
   */
  async addPaymentMethod(customerId: string, paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      logger.info(`Payment method added: ${paymentMethodId}`);
      return paymentMethod;
    } catch (error) {
      logger.error('Error adding payment method:', error);
      throw error;
    }
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);

      logger.info(`Payment method removed: ${paymentMethodId}`);
      return paymentMethod;
    } catch (error) {
      logger.error('Error removing payment method:', error);
      throw error;
    }
  }

  /**
   * Create a customer in Stripe
   */
  async createCustomer(userData: {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        metadata: userData.metadata,
      });

      logger.info(`Stripe customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Get payment history for a customer
   */
  async getPaymentHistory(customerId: string, page: number = 1, limit: number = 10): Promise<{
    payments: any[];
    pagination: { page: number; limit: number; total: number };
  }> {
    try {
      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        this.prisma.payment.findMany({
          where: { customerId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                total: true,
                status: true,
              },
            },
          },
        }),
        this.prisma.payment.count({
          where: { customerId },
        }),
      ]);

      return {
        payments,
        pagination: {
          page,
          limit,
          total,
        },
      };
    } catch (error) {
      logger.error('Error getting payment history:', error);
      throw error;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;
        default:
          logger.info(`Unhandled webhook event: ${event.type}`);
      }
    } catch (error) {
      logger.error('Error handling webhook event:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      await this.prisma.payment.update({
        where: { id: paymentIntent.id },
        data: {
          status: 'succeeded',
          updatedAt: new Date(),
        },
      });

      // Update order status if orderId exists
      if (paymentIntent.metadata.orderId) {
        await this.prisma.order.update({
          where: { id: paymentIntent.metadata.orderId },
          data: {
            status: 'paid',
            updatedAt: new Date(),
          },
        });
      }

      logger.info(`Payment succeeded: ${paymentIntent.id}`);
    } catch (error) {
      logger.error('Error handling payment success:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      await this.prisma.payment.update({
        where: { id: paymentIntent.id },
        data: {
          status: 'failed',
          updatedAt: new Date(),
        },
      });

      logger.info(`Payment failed: ${paymentIntent.id}`);
    } catch (error) {
      logger.error('Error handling payment failure:', error);
      throw error;
    }
  }

  /**
   * Handle charge refunded
   */
  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    try {
      if (charge.payment_intent) {
        await this.prisma.payment.update({
          where: { id: charge.payment_intent as string },
          data: {
            status: 'refunded',
            updatedAt: new Date(),
          },
        });
      }

      logger.info(`Charge refunded: ${charge.id}`);
    } catch (error) {
      logger.error('Error handling charge refund:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService(); 