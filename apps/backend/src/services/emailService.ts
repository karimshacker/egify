import nodemailer from 'nodemailer';
import { logger } from '@/utils/logger';
import { CustomError } from '@/middleware/errorHandler';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: options.from || process.env.EMAIL_FROM || 'noreply@egify.com',
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully: ${info.messageId}`);
    } catch (error) {
      logger.error('Error sending email:', error);
      throw new CustomError('Failed to send email', 500);
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    const template = this.getWelcomeEmailTemplate(userName);
    
    await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userEmail: string, resetToken: string, userName: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const template = this.getPasswordResetEmailTemplate(userName, resetUrl);
    
    await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send email verification email
   */
  async sendEmailVerificationEmail(userEmail: string, verificationToken: string, userName: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const template = this.getEmailVerificationTemplate(userName, verificationUrl);
    
    await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(
    customerEmail: string, 
    customerName: string, 
    orderNumber: string, 
    orderDetails: any
  ): Promise<void> {
    const template = this.getOrderConfirmationTemplate(customerName, orderNumber, orderDetails);
    
    await this.sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdateEmail(
    customerEmail: string, 
    customerName: string, 
    orderNumber: string, 
    status: string,
    orderDetails: any
  ): Promise<void> {
    const template = this.getOrderStatusUpdateTemplate(customerName, orderNumber, status, orderDetails);
    
    await this.sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send shipping confirmation email
   */
  async sendShippingConfirmationEmail(
    customerEmail: string, 
    customerName: string, 
    orderNumber: string, 
    trackingNumber: string,
    shippingDetails: any
  ): Promise<void> {
    const template = this.getShippingConfirmationTemplate(customerName, orderNumber, trackingNumber, shippingDetails);
    
    await this.sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send store invitation email
   */
  async sendStoreInvitationEmail(
    userEmail: string, 
    userName: string, 
    storeName: string, 
    invitationToken: string
  ): Promise<void> {
    const invitationUrl = `${process.env.FRONTEND_URL}/accept-invitation?token=${invitationToken}`;
    const template = this.getStoreInvitationTemplate(userName, storeName, invitationUrl);
    
    await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send low stock alert email
   */
  async sendLowStockAlertEmail(
    storeOwnerEmail: string, 
    storeName: string, 
    products: Array<{ name: string; sku: string; currentStock: number }>
  ): Promise<void> {
    const template = this.getLowStockAlertTemplate(storeName, products);
    
    await this.sendEmail({
      to: storeOwnerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send daily sales report email
   */
  async sendDailySalesReportEmail(
    storeOwnerEmail: string, 
    storeName: string, 
    reportData: any
  ): Promise<void> {
    const template = this.getDailySalesReportTemplate(storeName, reportData);
    
    await this.sendEmail({
      to: storeOwnerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Get welcome email template
   */
  private getWelcomeEmailTemplate(userName: string): EmailTemplate {
    return {
      subject: 'Welcome to Egify! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Egify, ${userName}!</h1>
          <p>Thank you for joining our platform. We're excited to have you on board!</p>
          <p>With Egify, you can:</p>
          <ul>
            <li>Create and manage your online store</li>
            <li>Sell products to customers worldwide</li>
            <li>Track your sales and analytics</li>
            <li>Manage your inventory efficiently</li>
          </ul>
          <p>Get started by creating your first store!</p>
          <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The Egify Team</p>
        </div>
      `,
      text: `Welcome to Egify, ${userName}! Thank you for joining our platform. Get started by visiting ${process.env.FRONTEND_URL}/dashboard`
    };
  }

  /**
   * Get password reset email template
   */
  private getPasswordResetEmailTemplate(userName: string, resetUrl: string): EmailTemplate {
    return {
      subject: 'Reset Your Password - Egify',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Reset Your Password</h1>
          <p>Hello ${userName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>The Egify Team</p>
        </div>
      `,
      text: `Hello ${userName}, click this link to reset your password: ${resetUrl}`
    };
  }

  /**
   * Get email verification template
   */
  private getEmailVerificationTemplate(userName: string, verificationUrl: string): EmailTemplate {
    return {
      subject: 'Verify Your Email - Egify',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Verify Your Email</h1>
          <p>Hello ${userName},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>The Egify Team</p>
        </div>
      `,
      text: `Hello ${userName}, click this link to verify your email: ${verificationUrl}`
    };
  }

  /**
   * Get order confirmation template
   */
  private getOrderConfirmationTemplate(customerName: string, orderNumber: string, orderDetails: any): EmailTemplate {
    const itemsHtml = orderDetails.items.map((item: any) => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.quantity}</td>
        <td>$${item.unitPrice.toFixed(2)}</td>
        <td>$${item.totalPrice.toFixed(2)}</td>
      </tr>
    `).join('');

    return {
      subject: `Order Confirmation - ${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Order Confirmation</h1>
          <p>Hello ${customerName},</p>
          <p>Thank you for your order! Your order has been confirmed and is being processed.</p>
          <h2>Order Details</h2>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Order Date:</strong> ${new Date(orderDetails.createdAt).toLocaleDateString()}</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; border: 1px solid #ddd;">Product</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Quantity</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Price</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <p><strong>Subtotal:</strong> $${orderDetails.subtotal.toFixed(2)}</p>
          <p><strong>Tax:</strong> $${orderDetails.taxAmount.toFixed(2)}</p>
          <p><strong>Shipping:</strong> $${orderDetails.shippingCost.toFixed(2)}</p>
          <p><strong>Total:</strong> $${orderDetails.total.toFixed(2)}</p>
          <p>We'll notify you when your order ships!</p>
          <p>Best regards,<br>${orderDetails.store.name}</p>
        </div>
      `,
      text: `Order Confirmation - ${orderNumber}. Total: $${orderDetails.total.toFixed(2)}`
    };
  }

  /**
   * Get order status update template
   */
  private getOrderStatusUpdateTemplate(customerName: string, orderNumber: string, status: string, orderDetails: any): EmailTemplate {
    return {
      subject: `Order Status Update - ${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Order Status Update</h1>
          <p>Hello ${customerName},</p>
          <p>Your order status has been updated:</p>
          <h2>Order Details</h2>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>New Status:</strong> ${status}</p>
          <p><strong>Store:</strong> ${orderDetails.store.name}</p>
          <p>Thank you for your business!</p>
          <p>Best regards,<br>${orderDetails.store.name}</p>
        </div>
      `,
      text: `Order Status Update - ${orderNumber}: ${status}`
    };
  }

  /**
   * Get shipping confirmation template
   */
  private getShippingConfirmationTemplate(customerName: string, orderNumber: string, trackingNumber: string, shippingDetails: any): EmailTemplate {
    return {
      subject: `Your Order Has Shipped - ${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Your Order Has Shipped!</h1>
          <p>Hello ${customerName},</p>
          <p>Great news! Your order has been shipped and is on its way to you.</p>
          <h2>Shipping Details</h2>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
          <p><strong>Carrier:</strong> ${shippingDetails.carrier}</p>
          <p><strong>Estimated Delivery:</strong> ${shippingDetails.estimatedDelivery}</p>
          <p>Track your package: <a href="${shippingDetails.trackingUrl}">${shippingDetails.trackingUrl}</a></p>
          <p>Thank you for your business!</p>
          <p>Best regards,<br>${shippingDetails.store.name}</p>
        </div>
      `,
      text: `Your Order Has Shipped - ${orderNumber}. Tracking: ${trackingNumber}`
    };
  }

  /**
   * Get store invitation template
   */
  private getStoreInvitationTemplate(userName: string, storeName: string, invitationUrl: string): EmailTemplate {
    return {
      subject: `You're Invited to Join ${storeName} on Egify`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Store Invitation</h1>
          <p>Hello ${userName},</p>
          <p>You've been invited to join <strong>${storeName}</strong> as a team member on Egify.</p>
          <p>Click the button below to accept the invitation:</p>
          <a href="${invitationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
          <p>This invitation will expire in 7 days.</p>
          <p>Best regards,<br>The Egify Team</p>
        </div>
      `,
      text: `You're invited to join ${storeName}. Click here to accept: ${invitationUrl}`
    };
  }

  /**
   * Get low stock alert template
   */
  private getLowStockAlertTemplate(storeName: string, products: Array<{ name: string; sku: string; currentStock: number }>): EmailTemplate {
    const productsHtml = products.map(product => `
      <tr>
        <td>${product.name}</td>
        <td>${product.sku}</td>
        <td>${product.currentStock}</td>
      </tr>
    `).join('');

    return {
      subject: `Low Stock Alert - ${storeName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc3545;">Low Stock Alert</h1>
          <p>The following products in <strong>${storeName}</strong> are running low on stock:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; border: 1px solid #ddd;">Product</th>
                <th style="padding: 10px; border: 1px solid #ddd;">SKU</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Current Stock</th>
              </tr>
            </thead>
            <tbody>
              ${productsHtml}
            </tbody>
          </table>
          <p>Please restock these items to avoid running out of inventory.</p>
          <a href="${process.env.FRONTEND_URL}/dashboard/inventory" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Manage Inventory</a>
          <p>Best regards,<br>The Egify Team</p>
        </div>
      `,
      text: `Low Stock Alert for ${storeName}. ${products.length} products need restocking.`
    };
  }

  /**
   * Get daily sales report template
   */
  private getDailySalesReportTemplate(storeName: string, reportData: any): EmailTemplate {
    return {
      subject: `Daily Sales Report - ${storeName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Daily Sales Report</h1>
          <p>Here's your daily sales summary for <strong>${storeName}</strong>:</p>
          <h2>Summary</h2>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Total Orders:</strong> ${reportData.totalOrders}</p>
          <p><strong>Total Revenue:</strong> $${reportData.totalRevenue.toFixed(2)}</p>
          <p><strong>Average Order Value:</strong> $${reportData.averageOrderValue.toFixed(2)}</p>
          <p><strong>New Customers:</strong> ${reportData.newCustomers}</p>
          <a href="${process.env.FRONTEND_URL}/dashboard/analytics" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View Full Report</a>
          <p>Best regards,<br>The Egify Team</p>
        </div>
      `,
      text: `Daily Sales Report for ${storeName}: ${reportData.totalOrders} orders, $${reportData.totalRevenue.toFixed(2)} revenue`
    };
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService(); 