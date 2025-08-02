import { Request, Response } from 'express';
import { orderService } from '@/services/orderService';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { 
  validateOrderCreate, 
  validateOrderUpdate,
  validateOrderSearch,
  validatePagination
} from '@/middleware/validation';

export class OrderController {
  /**
   * Create a new order
   * POST /api/stores/:storeId/orders
   */
  createOrder = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const customerId = req.user?.id || req.body.customerId;
    const orderData = req.body;
    
    const order = await orderService.createOrder(storeId, customerId, orderData);
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  });

  /**
   * Get all orders for a store
   * GET /api/stores/:storeId/orders
   */
  getStoreOrders = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      paymentStatus,
      customerId,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const orders = await orderService.getOrdersByStore(storeId, {
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      paymentStatus: paymentStatus as string,
      customerId: customerId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    });
    
    res.status(200).json({
      success: true,
      data: orders
    });
  });

  /**
   * Get customer orders
   * GET /api/orders/my-orders
   */
  getMyOrders = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.user?.id;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      storeId 
    } = req.query;
    
    const orders = await orderService.getOrdersByCustomer(customerId, {
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      storeId: storeId as string
    });
    
    res.status(200).json({
      success: true,
      data: orders
    });
  });

  /**
   * Get order by ID
   * GET /api/orders/:id
   */
  getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const userId = req.user?.id;
    
    const order = await orderService.getOrderById(orderId, userId);
    
    res.status(200).json({
      success: true,
      data: order
    });
  });

  /**
   * Get order by order number
   * GET /api/orders/number/:orderNumber
   */
  getOrderByNumber = asyncHandler(async (req: Request, res: Response) => {
    const orderNumber = req.params.orderNumber;
    const userId = req.user?.id;
    
    const order = await orderService.getOrderByNumber(orderNumber, userId);
    
    res.status(200).json({
      success: true,
      data: order
    });
  });

  /**
   * Update order status
   * PATCH /api/orders/:id/status
   */
  updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const storeId = req.params.storeId;
    const { status, notes } = req.body;
    
    const order = await orderService.updateOrderStatus(orderId, storeId, status, notes);
    
    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  });

  /**
   * Update payment status
   * PATCH /api/orders/:id/payment-status
   */
  updatePaymentStatus = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const storeId = req.params.storeId;
    const { paymentStatus, transactionId } = req.body;
    
    const order = await orderService.updatePaymentStatus(orderId, storeId, paymentStatus, transactionId);
    
    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: order
    });
  });

  /**
   * Cancel order
   * POST /api/orders/:id/cancel
   */
  cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const storeId = req.params.storeId;
    const { reason } = req.body;
    
    const order = await orderService.cancelOrder(orderId, storeId, reason);
    
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  });

  /**
   * Refund order
   * POST /api/orders/:id/refund
   */
  refundOrder = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const storeId = req.params.storeId;
    const { amount, reason, refundMethod } = req.body;
    
    const refund = await orderService.refundOrder(orderId, storeId, {
      amount,
      reason,
      refundMethod
    });
    
    res.status(200).json({
      success: true,
      message: 'Order refunded successfully',
      data: refund
    });
  });

  /**
   * Add order note
   * POST /api/orders/:id/notes
   */
  addOrderNote = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const storeId = req.params.storeId;
    const { note, isInternal = false } = req.body;
    
    const orderNote = await orderService.addOrderNote(orderId, storeId, note, isInternal);
    
    res.status(201).json({
      success: true,
      message: 'Order note added successfully',
      data: orderNote
    });
  });

  /**
   * Get order notes
   * GET /api/orders/:id/notes
   */
  getOrderNotes = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const userId = req.user?.id;
    
    const notes = await orderService.getOrderNotes(orderId, userId);
    
    res.status(200).json({
      success: true,
      data: notes
    });
  });

  /**
   * Get order analytics
   * GET /api/stores/:storeId/orders/analytics
   */
  getOrderAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const { period = '30d', startDate, endDate } = req.query;
    
    const analytics = await orderService.getOrderAnalytics(storeId, {
      period: period as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  });

  /**
   * Export orders
   * GET /api/stores/:storeId/orders/export
   */
  exportOrders = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const { format = 'csv', startDate, endDate, status } = req.query;
    
    const exportData = await orderService.exportOrders(storeId, {
      format: format as string,
      startDate: startDate as string,
      endDate: endDate as string,
      status: status as string
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${Date.now()}.csv`);
    
    res.status(200).send(exportData);
  });

  /**
   * Get order timeline
   * GET /api/orders/:id/timeline
   */
  getOrderTimeline = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const userId = req.user?.id;
    
    const timeline = await orderService.getOrderTimeline(orderId, userId);
    
    res.status(200).json({
      success: true,
      data: timeline
    });
  });

  /**
   * Resend order confirmation
   * POST /api/orders/:id/resend-confirmation
   */
  resendOrderConfirmation = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const storeId = req.params.storeId;
    
    await orderService.resendOrderConfirmation(orderId, storeId);
    
    res.status(200).json({
      success: true,
      message: 'Order confirmation email sent successfully'
    });
  });

  /**
   * Get order statistics
   * GET /api/stores/:storeId/orders/stats
   */
  getOrderStats = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const { period = '30d' } = req.query;
    
    const stats = await orderService.getOrderStats(storeId, period as string);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  });
}

export const orderController = new OrderController(); 