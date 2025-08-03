import { Router } from 'express';
import { shippingController } from '@/controllers/shippingController';
import { authMiddleware } from '@/middleware/auth';
import { storeAuthMiddleware } from '@/middleware/storeAuth';
import { validateRequest } from '@/middleware/validation';
import { shippingValidation } from '@/validations/shippingValidation';

const router = Router();

/**
 * @swagger
 * /api/shipping/methods:
 *   get:
 *     summary: Get available shipping methods
 *     tags: [Shipping]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *       - in: query
 *         name: postalCode
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shipping methods retrieved successfully
 *       400:
 *         description: Bad request
 */
router.get('/methods', shippingController.getShippingMethods);

/**
 * @swagger
 * /api/shipping/calculate:
 *   post:
 *     summary: Calculate shipping costs
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *               - items
 *               - destination
 *             properties:
 *               storeId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     variantId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     weight:
 *                       type: number
 *               destination:
 *                 type: object
 *                 properties:
 *                   country:
 *                     type: string
 *                   state:
 *                     type: string
 *                   city:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *     responses:
 *       200:
 *         description: Shipping costs calculated successfully
 *       400:
 *         description: Bad request
 */
router.post('/calculate', 
  validateRequest(shippingValidation.calculateShipping), 
  shippingController.calculateShipping
);

/**
 * @swagger
 * /api/shipping/track/{trackingNumber}:
 *   get:
 *     summary: Track shipment
 *     tags: [Shipping]
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: carrier
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tracking information retrieved successfully
 *       404:
 *         description: Tracking information not found
 */
router.get('/track/:trackingNumber', shippingController.trackShipment);

/**
 * @swagger
 * /api/shipping/zones:
 *   get:
 *     summary: Get shipping zones for store
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shipping zones retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/zones', 
  authMiddleware, 
  storeAuthMiddleware, 
  shippingController.getShippingZones
);

/**
 * @swagger
 * /api/shipping/zones:
 *   post:
 *     summary: Create shipping zone
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *               - name
 *               - countries
 *               - rates
 *             properties:
 *               storeId:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               countries:
 *                 type: array
 *                 items:
 *                   type: string
 *               states:
 *                 type: array
 *                 items:
 *                   type: string
 *               postalCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *               rates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     minOrderValue:
 *                       type: number
 *                     maxOrderValue:
 *                       type: number
 *                     estimatedDays:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Shipping zone created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/zones',
  authMiddleware,
  storeAuthMiddleware,
  validateRequest(shippingValidation.createShippingZone),
  shippingController.createShippingZone
);

/**
 * @swagger
 * /api/shipping/zones/{id}:
 *   put:
 *     summary: Update shipping zone
 *     tags: [Shipping]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               countries:
 *                 type: array
 *                 items:
 *                   type: string
 *               states:
 *                 type: array
 *                 items:
 *                   type: string
 *               postalCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *               rates:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Shipping zone updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shipping zone not found
 */
router.put('/zones/:id',
  authMiddleware,
  storeAuthMiddleware,
  validateRequest(shippingValidation.updateShippingZone),
  shippingController.updateShippingZone
);

/**
 * @swagger
 * /api/shipping/zones/{id}:
 *   delete:
 *     summary: Delete shipping zone
 *     tags: [Shipping]
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
 *         description: Shipping zone deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shipping zone not found
 */
router.delete('/zones/:id',
  authMiddleware,
  storeAuthMiddleware,
  shippingController.deleteShippingZone
);

/**
 * @swagger
 * /api/shipping/carriers:
 *   get:
 *     summary: Get available shipping carriers
 *     tags: [Shipping]
 *     responses:
 *       200:
 *         description: Shipping carriers retrieved successfully
 */
router.get('/carriers', shippingController.getShippingCarriers);

/**
 * @swagger
 * /api/shipping/rates:
 *   get:
 *     summary: Get shipping rates for store
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shipping rates retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/rates',
  authMiddleware,
  storeAuthMiddleware,
  shippingController.getShippingRates
);

export default router; 