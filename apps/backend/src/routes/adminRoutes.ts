import { Router } from 'express';
import { adminController } from '@/controllers/adminController';
import { authMiddleware } from '@/middleware/auth';
import { adminAuthMiddleware } from '@/middleware/adminAuth';
import { validateRequest } from '@/middleware/validation';
import { adminValidation } from '@/validations/adminValidation';

const router = Router();

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/dashboard',
  authMiddleware,
  adminAuthMiddleware,
  adminController.getDashboard
);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/users',
  authMiddleware,
  adminAuthMiddleware,
  adminController.getUsers
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 */
router.get('/users/:id',
  authMiddleware,
  adminAuthMiddleware,
  adminController.getUser
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, STORE_OWNER, CUSTOMER]
 *               isActive:
 *                 type: boolean
 *               emailVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 */
router.put('/users/:id',
  authMiddleware,
  adminAuthMiddleware,
  validateRequest(adminValidation.updateUser),
  adminController.updateUser
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 */
router.delete('/users/:id',
  authMiddleware,
  adminAuthMiddleware,
  adminController.deleteUser
);

/**
 * @swagger
 * /api/admin/stores:
 *   get:
 *     summary: Get all stores (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stores retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/stores',
  authMiddleware,
  adminAuthMiddleware,
  adminController.getStores
);

/**
 * @swagger
 * /api/admin/stores/{id}:
 *   get:
 *     summary: Get store details (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Store details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Store not found
 */
router.get('/stores/:id',
  authMiddleware,
  adminAuthMiddleware,
  adminController.getStore
);

/**
 * @swagger
 * /api/admin/stores/{id}:
 *   put:
 *     summary: Update store (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ACTIVE, SUSPENDED, CLOSED]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Store updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Store not found
 */
router.put('/stores/:id',
  authMiddleware,
  adminAuthMiddleware,
  validateRequest(adminValidation.updateStore),
  adminController.updateStore
);

/**
 * @swagger
 * /api/admin/stores/{id}:
 *   delete:
 *     summary: Delete store (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Store deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Store not found
 */
router.delete('/stores/:id',
  authMiddleware,
  adminAuthMiddleware,
  adminController.deleteStore
);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/orders',
  authMiddleware,
  adminAuthMiddleware,
  adminController.getOrders
);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   get:
 *     summary: Get order details (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Order not found
 */
router.get('/orders/:id',
  authMiddleware,
  adminAuthMiddleware,
  adminController.getOrder
);

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get platform analytics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/analytics',
  authMiddleware,
  adminAuthMiddleware,
  adminController.getAnalytics
);

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get platform settings (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/settings',
  authMiddleware,
  adminAuthMiddleware,
  adminController.getSettings
);

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Update platform settings (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platformName:
 *                 type: string
 *               platformDescription:
 *                 type: string
 *               maintenanceMode:
 *                 type: boolean
 *               registrationEnabled:
 *                 type: boolean
 *               emailVerificationRequired:
 *                 type: boolean
 *               maxStoresPerUser:
 *                 type: integer
 *               maxProductsPerStore:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/settings',
  authMiddleware,
  adminAuthMiddleware,
  validateRequest(adminValidation.updateSettings),
  adminController.updateSettings
);

/**
 * @swagger
 * /api/admin/system/health:
 *   get:
 *     summary: Get system health status (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/system/health',
  authMiddleware,
  adminAuthMiddleware,
  adminController.getSystemHealth
);

/**
 * @swagger
 * /api/admin/system/logs:
 *   get:
 *     summary: Get system logs (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: System logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/system/logs',
  authMiddleware,
  adminAuthMiddleware,
  adminController.getSystemLogs
);

export default router; 