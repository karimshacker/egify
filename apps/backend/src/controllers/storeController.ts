import { Request, Response } from 'express';
import { storeService } from '@/services/storeService';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { 
  validateStoreCreate, 
  validateStoreUpdate,
  validateStoreSettings,
  validatePagination
} from '@/middleware/validation';

export class StoreController {
  /**
   * Create a new store
   * POST /api/stores
   */
  createStore = asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.user?.id;
    const storeData = req.body;
    
    const store = await storeService.createStore(ownerId, storeData);
    
    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: store
    });
  });

  /**
   * Get all stores for current user
   * GET /api/stores
   */
  getMyStores = asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.user?.id;
    const { page = 1, limit = 10, status, search } = req.query;
    
    const stores = await storeService.getStoresByOwner(ownerId, {
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      search: search as string
    });
    
    res.status(200).json({
      success: true,
      data: stores
    });
  });

  /**
   * Get store by ID
   * GET /api/stores/:id
   */
  getStoreById = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.id;
    const userId = req.user?.id;
    
    const store = await storeService.getStoreById(storeId, userId);
    
    res.status(200).json({
      success: true,
      data: store
    });
  });

  /**
   * Get store by slug (public)
   * GET /api/stores/slug/:slug
   */
  getStoreBySlug = asyncHandler(async (req: Request, res: Response) => {
    const slug = req.params.slug;
    
    const store = await storeService.getStoreBySlug(slug);
    
    res.status(200).json({
      success: true,
      data: store
    });
  });

  /**
   * Update store
   * PUT /api/stores/:id
   */
  updateStore = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.id;
    const userId = req.user?.id;
    const updateData = req.body;
    
    const store = await storeService.updateStore(storeId, userId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Store updated successfully',
      data: store
    });
  });

  /**
   * Delete store (soft delete)
   * DELETE /api/stores/:id
   */
  deleteStore = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.id;
    const userId = req.user?.id;
    
    await storeService.deleteStore(storeId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Store deleted successfully'
    });
  });

  /**
   * Get store settings
   * GET /api/stores/:id/settings
   */
  getStoreSettings = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.id;
    const userId = req.user?.id;
    
    const settings = await storeService.getStoreSettings(storeId, userId);
    
    res.status(200).json({
      success: true,
      data: settings
    });
  });

  /**
   * Update store settings
   * PUT /api/stores/:id/settings
   */
  updateStoreSettings = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.id;
    const userId = req.user?.id;
    const settingsData = req.body;
    
    const settings = await storeService.updateStoreSettings(storeId, userId, settingsData);
    
    res.status(200).json({
      success: true,
      message: 'Store settings updated successfully',
      data: settings
    });
  });

  /**
   * Get store analytics
   * GET /api/stores/:id/analytics
   */
  getStoreAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.id;
    const userId = req.user?.id;
    const { period = '30d' } = req.query;
    
    const analytics = await storeService.getStoreAnalytics(storeId, userId, period as string);
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  });

  /**
   * Search stores (public)
   * GET /api/stores/search
   */
  searchStores = asyncHandler(async (req: Request, res: Response) => {
    const { q, category, location, page = 1, limit = 10 } = req.query;
    
    const stores = await storeService.searchStores({
      query: q as string,
      category: category as string,
      location: location as string,
      page: Number(page),
      limit: Number(limit)
    });
    
    res.status(200).json({
      success: true,
      data: stores
    });
  });

  /**
   * Get store categories
   * GET /api/stores/categories
   */
  getStoreCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await storeService.getStoreCategories();
    
    res.status(200).json({
      success: true,
      data: categories
    });
  });

  /**
   * Update store status
   * PATCH /api/stores/:id/status
   */
  updateStoreStatus = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.id;
    const userId = req.user?.id;
    const { status } = req.body;
    
    const store = await storeService.updateStoreStatus(storeId, userId, status);
    
    res.status(200).json({
      success: true,
      message: 'Store status updated successfully',
      data: store
    });
  });

  /**
   * Get store dashboard data
   * GET /api/stores/:id/dashboard
   */
  getStoreDashboard = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.id;
    const userId = req.user?.id;
    
    const dashboard = await storeService.getStoreDashboard(storeId, userId);
    
    res.status(200).json({
      success: true,
      data: dashboard
    });
  });
}

export const storeController = new StoreController(); 