import { Router } from 'express';
import { orderController } from '@/controllers/orderController';
import { authenticate, authorizeStoreAccess } from '@/middleware/auth';
import { 
  validateOrderCreate, 
  validateOrderUpdate,
  validateOrderSearch,
  validatePagination
} from '@/middleware/validation';

const router = Router();

// Protected routes
router.use(authenticate);

// Customer order routes
router.get('/my-orders', validatePagination, orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.get('/number/:orderNumber', orderController.getOrderByNumber);
router.get('/:id/timeline', orderController.getOrderTimeline);
router.get('/:id/notes', orderController.getOrderNotes);

// Store order management
router.post('/stores/:storeId/orders', authorizeStoreAccess, validateOrderCreate, orderController.createOrder);
router.get('/stores/:storeId/orders', authorizeStoreAccess, validatePagination, orderController.getStoreOrders);
router.patch('/:id/status', authorizeStoreAccess, validateOrderUpdate, orderController.updateOrderStatus);
router.patch('/:id/payment-status', authorizeStoreAccess, orderController.updatePaymentStatus);
router.post('/:id/cancel', authorizeStoreAccess, orderController.cancelOrder);
router.post('/:id/refund', authorizeStoreAccess, orderController.refundOrder);
router.post('/:id/notes', authorizeStoreAccess, orderController.addOrderNote);
router.post('/:id/resend-confirmation', authorizeStoreAccess, orderController.resendOrderConfirmation);

// Order analytics and exports
router.get('/stores/:storeId/orders/analytics', authorizeStoreAccess, orderController.getOrderAnalytics);
router.get('/stores/:storeId/orders/stats', authorizeStoreAccess, orderController.getOrderStats);
router.get('/stores/:storeId/orders/export', authorizeStoreAccess, orderController.exportOrders);

export default router; 