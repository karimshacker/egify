import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

export const validateWebhookSignature = (provider: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['x-signature'] || req.headers['stripe-signature'] || req.headers['paypal-signature'];
      const body = JSON.stringify(req.body);

      if (!signature) {
        throw new ApiError(400, 'Missing webhook signature');
      }

      let isValid = false;

      switch (provider) {
        case 'stripe':
          isValid = validateStripeSignature(body, signature as string);
          break;
        case 'paypal':
          isValid = validatePayPalSignature(body, signature as string);
          break;
        case 'shipping':
          isValid = validateShippingSignature(body, signature as string);
          break;
        case 'email':
          isValid = validateEmailSignature(body, signature as string);
          break;
        case 'sms':
          isValid = validateSMSSignature(body, signature as string);
          break;
        case 'analytics':
          isValid = validateAnalyticsSignature(body, signature as string);
          break;
        case 'custom':
          isValid = validateCustomSignature(body, signature as string);
          break;
        default:
          throw new ApiError(400, 'Invalid webhook provider');
      }

      if (!isValid) {
        throw new ApiError(400, 'Invalid webhook signature');
      }

      next();
    } catch (error) {
      logger.error(`Webhook signature validation failed for ${provider}:`, error);
      next(error);
    }
  };
};

/**
 * Validate Stripe webhook signature
 */
function validateStripeSignature(body: string, signature: string): boolean {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.warn('Stripe webhook secret not configured');
      return false;
    }

    // For development, allow all signatures
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // In production, validate the signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature.replace('whsec_', ''), 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    logger.error('Error validating Stripe signature:', error);
    return false;
  }
}

/**
 * Validate PayPal webhook signature
 */
function validatePayPalSignature(body: string, signature: string): boolean {
  try {
    const webhookSecret = process.env.PAYPAL_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.warn('PayPal webhook secret not configured');
      return false;
    }

    // For development, allow all signatures
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // In production, validate the signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    logger.error('Error validating PayPal signature:', error);
    return false;
  }
}

/**
 * Validate shipping carrier webhook signature
 */
function validateShippingSignature(body: string, signature: string): boolean {
  try {
    const webhookSecret = process.env.SHIPPING_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.warn('Shipping webhook secret not configured');
      return false;
    }

    // For development, allow all signatures
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // In production, validate the signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    logger.error('Error validating shipping signature:', error);
    return false;
  }
}

/**
 * Validate email service webhook signature
 */
function validateEmailSignature(body: string, signature: string): boolean {
  try {
    const webhookSecret = process.env.EMAIL_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.warn('Email webhook secret not configured');
      return false;
    }

    // For development, allow all signatures
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // In production, validate the signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    logger.error('Error validating email signature:', error);
    return false;
  }
}

/**
 * Validate SMS service webhook signature
 */
function validateSMSSignature(body: string, signature: string): boolean {
  try {
    const webhookSecret = process.env.SMS_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.warn('SMS webhook secret not configured');
      return false;
    }

    // For development, allow all signatures
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // In production, validate the signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    logger.error('Error validating SMS signature:', error);
    return false;
  }
}

/**
 * Validate analytics service webhook signature
 */
function validateAnalyticsSignature(body: string, signature: string): boolean {
  try {
    const webhookSecret = process.env.ANALYTICS_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.warn('Analytics webhook secret not configured');
      return false;
    }

    // For development, allow all signatures
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // In production, validate the signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    logger.error('Error validating analytics signature:', error);
    return false;
  }
}

/**
 * Validate custom webhook signature
 */
function validateCustomSignature(body: string, signature: string): boolean {
  try {
    const webhookSecret = process.env.CUSTOM_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.warn('Custom webhook secret not configured');
      return false;
    }

    // For development, allow all signatures
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // In production, validate the signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    logger.error('Error validating custom signature:', error);
    return false;
  }
} 