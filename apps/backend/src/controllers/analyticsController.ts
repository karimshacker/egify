import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { analyticsService } from '@/services/analyticsService';

export class AnalyticsController {
  /**
   * Get dashboard summary
   * GET /api/analytics/dashboard
   */
  getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId || req.user?.storeId;
    const { period = '30d' } = req.query;

    const summary = await analyticsService.getDashboardSummary(storeId);

    res.status(200).json({
      success: true,
      data: summary
    });
  });

  /**
   * Get sales analytics
   * GET /api/analytics/sales
   */
  getSalesAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId || req.user?.storeId;
    const { period = '30d' } = req.query;

    const analytics = await analyticsService.getSalesAnalytics(storeId, period as string);

    res.status(200).json({
      success: true,
      data: analytics
    });
  });

  /**
   * Get product analytics
   * GET /api/analytics/products
   */
  getProductAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId || req.user?.storeId;
    const { period = '30d' } = req.query;

    const analytics = await analyticsService.getProductAnalytics(storeId, period as string);

    res.status(200).json({
      success: true,
      data: analytics
    });
  });

  /**
   * Get customer analytics
   * GET /api/analytics/customers
   */
  getCustomerAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId || req.user?.storeId;
    const { period = '30d' } = req.query;

    const analytics = await analyticsService.getCustomerAnalytics(storeId, period as string);

    res.status(200).json({
      success: true,
      data: analytics
    });
  });

  /**
   * Get order analytics
   * GET /api/analytics/orders
   */
  getOrderAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId || req.user?.storeId;
    const { period = '30d' } = req.query;

    const analytics = await analyticsService.getOrderAnalytics(storeId, period as string);

    res.status(200).json({
      success: true,
      data: analytics
    });
  });

  /**
   * Get revenue trends
   * GET /api/analytics/revenue-trends
   */
  getRevenueTrends = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId || req.user?.storeId;
    const { period = '12m' } = req.query;

    const trends = await analyticsService.getRevenueTrends(storeId, period as string);

    res.status(200).json({
      success: true,
      data: trends
    });
  });

  /**
   * Get inventory analytics
   * GET /api/analytics/inventory
   */
  getInventoryAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId || req.user?.storeId;

    const analytics = await analyticsService.getInventoryAnalytics(storeId);

    res.status(200).json({
      success: true,
      data: analytics
    });
  });

  /**
   * Export analytics data
   * GET /api/analytics/export
   */
  exportAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId || req.user?.storeId;
    const { type, period = '30d', format = 'json' } = req.query;

    let data;
    switch (type) {
      case 'sales':
        data = await analyticsService.getSalesAnalytics(storeId, period as string);
        break;
      case 'products':
        data = await analyticsService.getProductAnalytics(storeId, period as string);
        break;
      case 'customers':
        data = await analyticsService.getCustomerAnalytics(storeId, period as string);
        break;
      case 'orders':
        data = await analyticsService.getOrderAnalytics(storeId, period as string);
        break;
      case 'revenue':
        data = await analyticsService.getRevenueTrends(storeId, period as string);
        break;
      case 'inventory':
        data = await analyticsService.getInventoryAnalytics(storeId);
        break;
      default:
        data = await analyticsService.getDashboardSummary(storeId);
    }

    if (format === 'csv') {
      // TODO: Implement CSV export
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-analytics.csv"`);
      res.status(200).send('CSV export not implemented yet');
    } else {
      res.status(200).json({
        success: true,
        data
      });
    }
  });

  /**
   * Get real-time analytics
   * GET /api/analytics/realtime
   */
  getRealTimeAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId || req.user?.storeId;

    // Get real-time data (last 24 hours)
    const [salesAnalytics, orderAnalytics] = await Promise.all([
      analyticsService.getSalesAnalytics(storeId, '24h'),
      analyticsService.getOrderAnalytics(storeId, '24h')
    ]);

    const realTimeData = {
      todaySales: salesAnalytics.totalSales,
      todayOrders: salesAnalytics.totalOrders,
      averageOrderValue: salesAnalytics.averageOrderValue,
      orderStatusDistribution: orderAnalytics.orderStatusDistribution,
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: realTimeData
    });
  });
}

export const analyticsController = new AnalyticsController(); 