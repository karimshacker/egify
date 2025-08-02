import { Router } from 'express';
import { storeController } from '@/controllers/storeController';
import { authenticate, authorize, authorizeStoreAccess } from '@/middleware/auth';
import { 
  validateStoreCreate, 
  validateStoreUpdate,
  validateStoreSettings,
  validatePagination
} from '@/middleware/validation';

const router = Router();

// Public routes
router.get('/search', storeController.searchStores);
router.get('/categories', storeController.getStoreCategories);
router.get('/slug/:slug', storeController.getStoreBySlug);

// Protected routes
router.use(authenticate);

// Store management
router.post('/', validateStoreCreate, storeController.createStore);
router.get('/', storeController.getMyStores);
router.get('/:id', authorizeStoreAccess, storeController.getStoreById);
router.put('/:id', authorizeStoreAccess, validateStoreUpdate, storeController.updateStore);
router.delete('/:id', authorizeStoreAccess, storeController.deleteStore);
router.patch('/:id/status', authorizeStoreAccess, storeController.updateStoreStatus);

// Store settings
router.get('/:id/settings', authorizeStoreAccess, storeController.getStoreSettings);
router.put('/:id/settings', authorizeStoreAccess, validateStoreSettings, storeController.updateStoreSettings);

// Store analytics and dashboard
router.get('/:id/analytics', authorizeStoreAccess, storeController.getStoreAnalytics);
router.get('/:id/dashboard', authorizeStoreAccess, storeController.getStoreDashboard);

export default router; 