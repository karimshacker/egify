import { Router } from 'express';
import { customerController } from '@/controllers/customerController';
import { authenticate, authorizeStoreAccess } from '@/middleware/auth';
import { 
  validateCustomerCreate, 
  validateCustomerUpdate,
  validateCustomerSearch,
  validatePagination
} from '@/middleware/validation';

const router = Router();

// Protected routes
router.use(authenticate);

// Store customer management
router.post('/stores/:storeId/customers', authorizeStoreAccess, validateCustomerCreate, customerController.createCustomer);
router.get('/stores/:storeId/customers', authorizeStoreAccess, validatePagination, customerController.getStoreCustomers);
router.get('/stores/:storeId/customers/search', authorizeStoreAccess, validateCustomerSearch, customerController.searchCustomers);
router.get('/stores/:storeId/customers/analytics', authorizeStoreAccess, customerController.getCustomerAnalytics);
router.get('/stores/:storeId/customers/export', authorizeStoreAccess, customerController.exportCustomers);
router.get('/stores/:storeId/customers/tags', authorizeStoreAccess, customerController.getCustomerTags);
router.patch('/stores/:storeId/customers/bulk', authorizeStoreAccess, customerController.bulkUpdateCustomers);

// Individual customer operations
router.get('/:id', authorizeStoreAccess, customerController.getCustomerById);
router.put('/:id', authorizeStoreAccess, validateCustomerUpdate, customerController.updateCustomer);
router.delete('/:id', authorizeStoreAccess, customerController.deleteCustomer);
router.post('/:id/notify', authorizeStoreAccess, customerController.sendCustomerNotification);

// Customer orders and reviews
router.get('/:id/orders', authorizeStoreAccess, validatePagination, customerController.getCustomerOrders);
router.get('/:id/reviews', authorizeStoreAccess, validatePagination, customerController.getCustomerReviews);

// Customer addresses
router.post('/:id/addresses', authorizeStoreAccess, customerController.addCustomerAddress);
router.put('/:id/addresses/:addressId', authorizeStoreAccess, customerController.updateCustomerAddress);
router.delete('/:id/addresses/:addressId', authorizeStoreAccess, customerController.deleteCustomerAddress);

// Customer tags
router.post('/:id/tags', authorizeStoreAccess, customerController.addCustomerTag);
router.delete('/:id/tags/:tag', authorizeStoreAccess, customerController.removeCustomerTag);

export default router; 