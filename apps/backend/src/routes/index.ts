import { Router } from 'express';
import authRoutes from './authRoutes';
import storeRoutes from './storeRoutes';
import productRoutes from './productRoutes';
import orderRoutes from './orderRoutes';
import customerRoutes from './customerRoutes';
import paymentRoutes from './paymentRoutes';
import uploadRoutes from './uploadRoutes';
import notificationRoutes from './notificationRoutes';
import analyticsRoutes from './analyticsRoutes';
import searchRoutes from './searchRoutes';

const router = Router();

// API version prefix
const API_PREFIX = '/api/v1';

// Mount routes
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/stores`, storeRoutes);
router.use(`${API_PREFIX}/products`, productRoutes);
router.use(`${API_PREFIX}/orders`, orderRoutes);
router.use(`${API_PREFIX}/customers`, customerRoutes);
router.use(`${API_PREFIX}/payments`, paymentRoutes);
router.use(`${API_PREFIX}/upload`, uploadRoutes);
router.use(`${API_PREFIX}/notifications`, notificationRoutes);
router.use(`${API_PREFIX}/analytics`, analyticsRoutes);
router.use(`${API_PREFIX}/search`, searchRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API info endpoint
router.get(`${API_PREFIX}/info`, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'Egify API',
      version: '1.0.0',
      description: 'E-commerce platform API',
      endpoints: {
        auth: `${API_PREFIX}/auth`,
        stores: `${API_PREFIX}/stores`,
        products: `${API_PREFIX}/products`,
        orders: `${API_PREFIX}/orders`,
        customers: `${API_PREFIX}/customers`,
        payments: `${API_PREFIX}/payments`,
        upload: `${API_PREFIX}/upload`,
        notifications: `${API_PREFIX}/notifications`,
        analytics: `${API_PREFIX}/analytics`,
        search: `${API_PREFIX}/search`
      }
    }
  });
});

export default router; 