import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { searchService } from '@/services/searchService';

export class SearchController {
  /**
   * Search products
   * GET /api/search/products
   */
  searchProducts = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId || req.user?.storeId;
    const filters = req.query;

    const result = await searchService.searchProducts(storeId, filters);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  /**
   * Search customers
   * GET /api/search/customers
   */
  searchCustomers = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId || req.user?.storeId;
    const filters = req.query;

    const result = await searchService.searchCustomers(storeId, filters);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  /**
   * Search orders
   * GET /api/search/orders
   */
  searchOrders = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId || req.user?.storeId;
    const filters = req.query;

    const result = await searchService.searchOrders(storeId, filters);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  /**
   * Get search suggestions
   * GET /api/search/suggestions
   */
  getSearchSuggestions = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId || req.user?.storeId;
    const { query, type = 'products' } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required'
      });
    }

    const suggestions = await searchService.getSearchSuggestions(
      storeId,
      query,
      type as 'products' | 'customers'
    );

    res.status(200).json({
      success: true,
      data: suggestions
    });
  });

  /**
   * Get popular search terms
   * GET /api/search/popular
   */
  getPopularSearchTerms = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId || req.user?.storeId;
    const { limit = 10 } = req.query;

    const terms = await searchService.getPopularSearchTerms(storeId, Number(limit));

    res.status(200).json({
      success: true,
      data: terms
    });
  });

  /**
   * Get search analytics
   * GET /api/search/analytics
   */
  getSearchAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId || req.user?.storeId;
    const { period = '30d' } = req.query;

    const analytics = await searchService.getSearchAnalytics(storeId, period as string);

    res.status(200).json({
      success: true,
      data: analytics
    });
  });

  /**
   * Global search across multiple entities
   * GET /api/search/global
   */
  globalSearch = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId || req.user?.storeId;
    const { query, limit = 10 } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required'
      });
    }

    // Search across multiple entities
    const [products, customers, orders] = await Promise.all([
      searchService.searchProducts(storeId, { query, limit: Math.floor(Number(limit) / 3) }),
      searchService.searchCustomers(storeId, { query, limit: Math.floor(Number(limit) / 3) }),
      searchService.searchOrders(storeId, { query, limit: Math.floor(Number(limit) / 3) })
    ]);

    const result = {
      products: products.data,
      customers: customers.data,
      orders: orders.data,
      totalResults: products.pagination.total + customers.pagination.total + orders.pagination.total
    };

    res.status(200).json({
      success: true,
      data: result
    });
  });
}

export const searchController = new SearchController(); 