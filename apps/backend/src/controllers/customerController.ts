import { Request, Response } from 'express';
import { customerService } from '@/services/customerService';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { 
  validateCustomerCreate, 
  validateCustomerUpdate,
  validateCustomerSearch,
  validatePagination
} from '@/middleware/validation';

export class CustomerController {
  /**
   * Create a new customer
   * POST /api/stores/:storeId/customers
   */
  createCustomer = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const customerData = req.body;
    
    const customer = await customerService.createCustomer(storeId, customerData);
    
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  });

  /**
   * Get all customers for a store
   * GET /api/stores/:storeId/customers
   */
  getStoreCustomers = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const { 
      page = 1, 
      limit = 10, 
      search, 
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      hasOrders,
      isVerified
    } = req.query;
    
    const customers = await customerService.getCustomersByStore(storeId, {
      page: Number(page),
      limit: Number(limit),
      search: search as string,
      tags: tags as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      hasOrders: hasOrders === 'true',
      isVerified: isVerified === 'true'
    });
    
    res.status(200).json({
      success: true,
      data: customers
    });
  });

  /**
   * Get customer by ID
   * GET /api/customers/:id
   */
  getCustomerById = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.params.id;
    const storeId = req.params.storeId;
    
    const customer = await customerService.getCustomerById(customerId, storeId);
    
    res.status(200).json({
      success: true,
      data: customer
    });
  });

  /**
   * Update customer
   * PUT /api/customers/:id
   */
  updateCustomer = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.params.id;
    const storeId = req.params.storeId;
    const updateData = req.body;
    
    const customer = await customerService.updateCustomer(customerId, storeId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  });

  /**
   * Delete customer (soft delete)
   * DELETE /api/customers/:id
   */
  deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.params.id;
    const storeId = req.params.storeId;
    
    await customerService.deleteCustomer(customerId, storeId);
    
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  });

  /**
   * Get customer orders
   * GET /api/customers/:id/orders
   */
  getCustomerOrders = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.params.id;
    const storeId = req.params.storeId;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      startDate, 
      endDate 
    } = req.query;
    
    const orders = await customerService.getCustomerOrders(customerId, storeId, {
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.status(200).json({
      success: true,
      data: orders
    });
  });

  /**
   * Get customer reviews
   * GET /api/customers/:id/reviews
   */
  getCustomerReviews = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.params.id;
    const storeId = req.params.storeId;
    const { page = 1, limit = 10 } = req.query;
    
    const reviews = await customerService.getCustomerReviews(customerId, storeId, {
      page: Number(page),
      limit: Number(limit)
    });
    
    res.status(200).json({
      success: true,
      data: reviews
    });
  });

  /**
   * Add customer address
   * POST /api/customers/:id/addresses
   */
  addCustomerAddress = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.params.id;
    const storeId = req.params.storeId;
    const addressData = req.body;
    
    const address = await customerService.addCustomerAddress(customerId, storeId, addressData);
    
    res.status(201).json({
      success: true,
      message: 'Customer address added successfully',
      data: address
    });
  });

  /**
   * Update customer address
   * PUT /api/customers/:id/addresses/:addressId
   */
  updateCustomerAddress = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.params.id;
    const addressId = req.params.addressId;
    const storeId = req.params.storeId;
    const updateData = req.body;
    
    const address = await customerService.updateCustomerAddress(customerId, addressId, storeId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Customer address updated successfully',
      data: address
    });
  });

  /**
   * Delete customer address
   * DELETE /api/customers/:id/addresses/:addressId
   */
  deleteCustomerAddress = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.params.id;
    const addressId = req.params.addressId;
    const storeId = req.params.storeId;
    
    await customerService.deleteCustomerAddress(customerId, addressId, storeId);
    
    res.status(200).json({
      success: true,
      message: 'Customer address deleted successfully'
    });
  });

  /**
   * Add customer tag
   * POST /api/customers/:id/tags
   */
  addCustomerTag = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.params.id;
    const storeId = req.params.storeId;
    const { tag } = req.body;
    
    const customer = await customerService.addCustomerTag(customerId, storeId, tag);
    
    res.status(200).json({
      success: true,
      message: 'Customer tag added successfully',
      data: customer
    });
  });

  /**
   * Remove customer tag
   * DELETE /api/customers/:id/tags/:tag
   */
  removeCustomerTag = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.params.id;
    const tag = req.params.tag;
    const storeId = req.params.storeId;
    
    const customer = await customerService.removeCustomerTag(customerId, storeId, tag);
    
    res.status(200).json({
      success: true,
      message: 'Customer tag removed successfully',
      data: customer
    });
  });

  /**
   * Search customers
   * GET /api/stores/:storeId/customers/search
   */
  searchCustomers = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const { 
      q, 
      tags, 
      hasOrders, 
      isVerified,
      page = 1, 
      limit = 10 
    } = req.query;
    
    const customers = await customerService.searchCustomers(storeId, {
      query: q as string,
      tags: tags as string,
      hasOrders: hasOrders === 'true',
      isVerified: isVerified === 'true',
      page: Number(page),
      limit: Number(limit)
    });
    
    res.status(200).json({
      success: true,
      data: customers
    });
  });

  /**
   * Get customer analytics
   * GET /api/stores/:storeId/customers/analytics
   */
  getCustomerAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const { period = '30d', startDate, endDate } = req.query;
    
    const analytics = await customerService.getCustomerAnalytics(storeId, {
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
   * Export customers
   * GET /api/stores/:storeId/customers/export
   */
  exportCustomers = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const { format = 'csv', tags, hasOrders } = req.query;
    
    const exportData = await customerService.exportCustomers(storeId, {
      format: format as string,
      tags: tags as string,
      hasOrders: hasOrders === 'true'
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=customers-${Date.now()}.csv`);
    
    res.status(200).send(exportData);
  });

  /**
   * Get customer tags
   * GET /api/stores/:storeId/customers/tags
   */
  getCustomerTags = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    
    const tags = await customerService.getCustomerTags(storeId);
    
    res.status(200).json({
      success: true,
      data: tags
    });
  });

  /**
   * Bulk update customers
   * PATCH /api/stores/:storeId/customers/bulk
   */
  bulkUpdateCustomers = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const { customerIds, updates } = req.body;
    
    const result = await customerService.bulkUpdateCustomers(storeId, customerIds, updates);
    
    res.status(200).json({
      success: true,
      message: 'Customers updated successfully',
      data: result
    });
  });

  /**
   * Send customer notification
   * POST /api/customers/:id/notify
   */
  sendCustomerNotification = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.params.id;
    const storeId = req.params.storeId;
    const { type, subject, message, channels } = req.body;
    
    await customerService.sendCustomerNotification(customerId, storeId, {
      type,
      subject,
      message,
      channels
    });
    
    res.status(200).json({
      success: true,
      message: 'Customer notification sent successfully'
    });
  });
}

export const customerController = new CustomerController(); 