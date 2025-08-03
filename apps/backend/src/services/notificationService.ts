import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { emailService } from './emailService';
import { io } from '@/index';

export interface NotificationData {
  type: string;
  title: string;
  message: string;
  data?: any;
  recipients?: string[];
  storeId?: string;
  userId?: string;
  customerId?: string;
}

export interface NotificationTemplate {
  email?: {
    subject: string;
    template: string;
  };
  push?: {
    title: string;
    body: string;
  };
  sms?: {
    message: string;
  };
}

export class NotificationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Send notification to multiple channels
   */
  async sendNotification(notificationData: NotificationData): Promise<void> {
    try {
      const { type, title, message, data, recipients, storeId, userId, customerId } = notificationData;

      // Send real-time notification via Socket.IO
      await this.sendRealTimeNotification(notificationData);

      // Send email notification if configured
      if (this.shouldSendEmail(type)) {
        await this.sendEmailNotification(notificationData);
      }

      // Send push notification if configured
      if (this.shouldSendPush(type)) {
        await this.sendPushNotification(notificationData);
      }

      // Store notification in database
      await this.storeNotification(notificationData);

      logger.info(`Notification sent: ${type} to ${recipients?.length || 0} recipients`);
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  }

  /**
   * Send real-time notification via Socket.IO
   */
  private async sendRealTimeNotification(notificationData: NotificationData): Promise<void> {
    try {
      const { type, title, message, data, storeId, userId, customerId } = notificationData;

      const notification = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        title,
        message,
        data,
        timestamp: new Date().toISOString()
      };

      // Send to specific user
      if (userId) {
        io.to(`user-${userId}`).emit('notification', notification);
      }

      // Send to store room
      if (storeId) {
        io.to(`store-${storeId}`).emit('notification', notification);
      }

      // Send to all connected clients (for admin notifications)
      if (type.startsWith('admin.')) {
        io.emit('notification', notification);
      }
    } catch (error) {
      logger.error('Error sending real-time notification:', error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notificationData: NotificationData): Promise<void> {
    try {
      const { type, title, message, recipients, data } = notificationData;

      if (!recipients || recipients.length === 0) {
        return;
      }

      const template = this.getEmailTemplate(type, data);
      if (!template) {
        return;
      }

      await emailService.sendEmail({
        to: recipients,
        subject: template.subject,
        html: this.renderEmailTemplate(template.template, data)
      });
    } catch (error) {
      logger.error('Error sending email notification:', error);
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(notificationData: NotificationData): Promise<void> {
    try {
      const { type, title, message, userId, customerId } = notificationData;

      // TODO: Implement push notification logic
      // This would integrate with services like Firebase Cloud Messaging
      logger.info(`Push notification would be sent: ${title} - ${message}`);
    } catch (error) {
      logger.error('Error sending push notification:', error);
    }
  }

  /**
   * Store notification in database
   */
  private async storeNotification(notificationData: NotificationData): Promise<void> {
    try {
      const { type, title, message, data, userId, customerId } = notificationData;

      await this.prisma.notification.create({
        data: {
          type,
          title,
          message,
          data,
          userId,
          customerId,
          isRead: false
        }
      });

      logger.info(`Notification stored in database: ${title}`);
    } catch (error) {
      logger.error('Error storing notification:', error);
    }
  }

  /**
   * Check if email should be sent for notification type
   */
  private shouldSendEmail(type: string): boolean {
    const emailTypes = [
      'order.created',
      'order.confirmed',
      'order.shipped',
      'order.delivered',
      'order.cancelled',
      'payment.failed',
      'payment.successful',
      'customer.registered',
      'password.reset',
      'email.verification'
    ];

    return emailTypes.includes(type);
  }

  /**
   * Check if push notification should be sent for notification type
   */
  private shouldSendPush(type: string): boolean {
    const pushTypes = [
      'order.created',
      'order.confirmed',
      'order.shipped',
      'order.delivered',
      'payment.failed',
      'payment.successful',
      'inventory.low_stock',
      'customer.new_review'
    ];

    return pushTypes.includes(type);
  }

  /**
   * Get email template for notification type
   */
  private getEmailTemplate(type: string, data: any): { subject: string; template: string } | null {
    const templates: Record<string, { subject: string; template: string }> = {
      'order.created': {
        subject: 'Order Confirmation - #{orderNumber}',
        template: `
          <h2>Order Confirmation</h2>
          <p>Dear #{customerName},</p>
          <p>Thank you for your order! Your order has been received and is being processed.</p>
          <h3>Order Details:</h3>
          <p><strong>Order Number:</strong> #{orderNumber}</p>
          <p><strong>Total Amount:</strong> #{total}</p>
          <p><strong>Order Date:</strong> #{orderDate}</p>
          <p>We'll send you updates as your order progresses.</p>
        `
      },
      'order.confirmed': {
        subject: 'Order Confirmed - #{orderNumber}',
        template: `
          <h2>Order Confirmed</h2>
          <p>Dear #{customerName},</p>
          <p>Great news! Your order has been confirmed and is being prepared for shipment.</p>
          <h3>Order Details:</h3>
          <p><strong>Order Number:</strong> #{orderNumber}</p>
          <p><strong>Expected Shipment:</strong> #{expectedShipment}</p>
        `
      },
      'order.shipped': {
        subject: 'Order Shipped - #{orderNumber}',
        template: `
          <h2>Order Shipped</h2>
          <p>Dear #{customerName},</p>
          <p>Your order has been shipped! You can track your package using the tracking number below.</p>
          <h3>Shipping Details:</h3>
          <p><strong>Order Number:</strong> #{orderNumber}</p>
          <p><strong>Tracking Number:</strong> #{trackingNumber}</p>
          <p><strong>Carrier:</strong> #{carrier}</p>
        `
      },
      'payment.failed': {
        subject: 'Payment Failed - #{orderNumber}',
        template: `
          <h2>Payment Failed</h2>
          <p>Dear #{customerName},</p>
          <p>We were unable to process your payment for order #{orderNumber}.</p>
          <p>Please update your payment information to complete your order.</p>
        `
      },
      'inventory.low_stock': {
        subject: 'Low Stock Alert - #{productName}',
        template: `
          <h2>Low Stock Alert</h2>
          <p>Product: #{productName}</p>
          <p>Current Stock: #{currentStock}</p>
          <p>Low Stock Threshold: #{threshold}</p>
          <p>Please restock this product soon.</p>
        `
      }
    };

    return templates[type] || null;
  }

  /**
   * Render email template with data
   */
  private renderEmailTemplate(template: string, data: any): string {
    let rendered = template;
    
    // Replace placeholders with actual data
    Object.keys(data).forEach(key => {
      const placeholder = `#{${key}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), data[key]);
    });

    return rendered;
  }

  /**
   * Send order-related notifications
   */
  async sendOrderNotification(order: any, type: string): Promise<void> {
    const notificationData: NotificationData = {
      type: `order.${type}`,
      title: `Order ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      message: `Order ${order.orderNumber} has been ${type}`,
      data: {
        orderNumber: order.orderNumber,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        total: order.total,
        orderDate: order.createdAt,
        expectedShipment: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        trackingNumber: order.trackingNumber || 'TBD',
        carrier: order.carrier || 'TBD'
      },
      recipients: [order.customer.email],
      storeId: order.storeId,
      customerId: order.customerId
    };

    await this.sendNotification(notificationData);
  }

  /**
   * Send payment-related notifications
   */
  async sendPaymentNotification(payment: any, type: string): Promise<void> {
    const notificationData: NotificationData = {
      type: `payment.${type}`,
      title: `Payment ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      message: `Payment for order ${payment.order.orderNumber} has ${type}`,
      data: {
        orderNumber: payment.order.orderNumber,
        amount: payment.amount,
        method: payment.method
      },
      recipients: [payment.order.customer.email],
      storeId: payment.order.storeId,
      customerId: payment.order.customerId
    };

    await this.sendNotification(notificationData);
  }

  /**
   * Send inventory-related notifications
   */
  async sendInventoryNotification(product: any, variant: any): Promise<void> {
    const notificationData: NotificationData = {
      type: 'inventory.low_stock',
      title: 'Low Stock Alert',
      message: `Product ${product.name} is running low on stock`,
      data: {
        productName: product.name,
        variantName: variant.name,
        currentStock: variant.inventory,
        threshold: product.lowStockThreshold
      },
      storeId: product.storeId
    };

    await this.sendNotification(notificationData);
  }

  /**
   * Send customer-related notifications
   */
  async sendCustomerNotification(customer: any, type: string): Promise<void> {
    const notificationData: NotificationData = {
      type: `customer.${type}`,
      title: `Customer ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      message: `Customer ${customer.firstName} ${customer.lastName} has ${type}`,
      data: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email
      },
      storeId: customer.storeId,
      customerId: customer.id
    };

    await this.sendNotification(notificationData);
  }

  /**
   * Send admin notifications
   */
  async sendAdminNotification(type: string, title: string, message: string, data?: any): Promise<void> {
    const notificationData: NotificationData = {
      type: `admin.${type}`,
      title,
      message,
      data
    };

    await this.sendNotification(notificationData);
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, limit: number = 20): Promise<any[]> {
    try {
      return await this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      logger.info(`Notification marked as read: ${notificationId}`);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }


  /**
   * Get unread notification count for a user
   */
  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      return await this.prisma.notification.count({
        where: { userId, isRead: false }
      });
    } catch (error) {
      logger.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      logger.info(`All notifications marked as read for user: ${userId}`);
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      await this.prisma.notification.deleteMany({
        where: { id: notificationId, userId }
      });

      logger.info(`Notification deleted: ${notificationId}`);
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get user notification settings
   */
  async getUserNotificationSettings(userId: string): Promise<any> {
    try {
      // This would typically come from a user settings table
      // For now, return default settings
      return {
        email: {
          orderUpdates: true,
          paymentNotifications: true,
          marketing: false,
          security: true
        },
        push: {
          orderUpdates: true,
          paymentNotifications: true,
          marketing: false,
          security: true
        },
        sms: {
          orderUpdates: false,
          paymentNotifications: true,
          marketing: false,
          security: true
        }
      };
    } catch (error) {
      logger.error('Error getting user notification settings:', error);
      throw error;
    }
  }

  /**
   * Update user notification settings
   */
  async updateUserNotificationSettings(userId: string, settings: any): Promise<void> {
    try {
      // This would typically update a user settings table
      // For now, just log the update
      logger.info(`Notification settings updated for user: ${userId}`, settings);
    } catch (error) {
      logger.error('Error updating user notification settings:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService(); 