import { Router } from 'express';
import { analyticsController } from '@/controllers/analyticsController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// All analytics routes require authentication and store owner/admin authorization
router.use(authenticate);
router.use(authorize(['STORE_OWNER', 'ADMIN']));

// Dashboard summary
router.get('/dashboard', analyticsController.getDashboardSummary);

// Sales analytics
router.get('/sales', analyticsController.getSalesAnalytics);

// Product analytics
router.get('/products', analyticsController.getProductAnalytics);

// Customer analytics
router.get('/customers', analyticsController.getCustomerAnalytics);

// Order analytics
router.get('/orders', analyticsController.getOrderAnalytics);

// Revenue trends
router.get('/revenue-trends', analyticsController.getRevenueTrends);

// Inventory analytics
router.get('/inventory', analyticsController.getInventoryAnalytics);

// Real-time analytics
router.get('/realtime', analyticsController.getRealTimeAnalytics);

// Export analytics data
router.get('/export', analyticsController.exportAnalytics);

export default router; 