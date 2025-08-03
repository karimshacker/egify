import { Router } from 'express';
import { searchController } from '@/controllers/searchController';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All search routes require authentication
router.use(authenticate);

// Product search
router.get('/products', searchController.searchProducts);

// Customer search
router.get('/customers', searchController.searchCustomers);

// Order search
router.get('/orders', searchController.searchOrders);

// Search suggestions
router.get('/suggestions', searchController.getSearchSuggestions);

// Popular search terms
router.get('/popular', searchController.getPopularSearchTerms);

// Search analytics
router.get('/analytics', searchController.getSearchAnalytics);

// Global search
router.get('/global', searchController.globalSearch);

export default router; 