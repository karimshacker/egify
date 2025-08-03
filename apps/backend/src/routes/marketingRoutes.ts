import { Router } from 'express';
import { marketingController } from '@/controllers/marketingController';
import { authMiddleware } from '@/middleware/auth';
import { storeAuthMiddleware } from '@/middleware/storeAuth';
import { validateRequest } from '@/middleware/validation';
import { marketingValidation } from '@/validations/marketingValidation';

const router = Router();

/**
 * @swagger
 * /api/marketing/campaigns:
 *   get:
 *     summary: Get marketing campaigns for store
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, paused, completed]
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
 *     responses:
 *       200:
 *         description: Campaigns retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/campaigns',
  authMiddleware,
  storeAuthMiddleware,
  marketingController.getCampaigns
);

/**
 * @swagger
 * /api/marketing/campaigns:
 *   post:
 *     summary: Create new marketing campaign
 *     tags: [Marketing]
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
 *               - type
 *               - targetAudience
 *             properties:
 *               storeId:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [email, sms, push, social]
 *               targetAudience:
 *                 type: object
 *               budget:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               content:
 *                 type: object
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/campaigns',
  authMiddleware,
  storeAuthMiddleware,
  validateRequest(marketingValidation.createCampaign),
  marketingController.createCampaign
);

/**
 * @swagger
 * /api/marketing/campaigns/{id}:
 *   get:
 *     summary: Get campaign details
 *     tags: [Marketing]
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
 *         description: Campaign details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Campaign not found
 */
router.get('/campaigns/:id',
  authMiddleware,
  storeAuthMiddleware,
  marketingController.getCampaign
);

/**
 * @swagger
 * /api/marketing/campaigns/{id}:
 *   put:
 *     summary: Update campaign
 *     tags: [Marketing]
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
 *               targetAudience:
 *                 type: object
 *               budget:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               content:
 *                 type: object
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Campaign not found
 */
router.put('/campaigns/:id',
  authMiddleware,
  storeAuthMiddleware,
  validateRequest(marketingValidation.updateCampaign),
  marketingController.updateCampaign
);

/**
 * @swagger
 * /api/marketing/campaigns/{id}/launch:
 *   post:
 *     summary: Launch campaign
 *     tags: [Marketing]
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
 *         description: Campaign launched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Campaign not found
 */
router.post('/campaigns/:id/launch',
  authMiddleware,
  storeAuthMiddleware,
  marketingController.launchCampaign
);

/**
 * @swagger
 * /api/marketing/campaigns/{id}/pause:
 *   post:
 *     summary: Pause campaign
 *     tags: [Marketing]
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
 *         description: Campaign paused successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Campaign not found
 */
router.post('/campaigns/:id/pause',
  authMiddleware,
  storeAuthMiddleware,
  marketingController.pauseCampaign
);

/**
 * @swagger
 * /api/marketing/campaigns/{id}:
 *   delete:
 *     summary: Delete campaign
 *     tags: [Marketing]
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
 *         description: Campaign deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Campaign not found
 */
router.delete('/campaigns/:id',
  authMiddleware,
  storeAuthMiddleware,
  marketingController.deleteCampaign
);

/**
 * @swagger
 * /api/marketing/campaigns/{id}/analytics:
 *   get:
 *     summary: Get campaign analytics
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Campaign analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Campaign not found
 */
router.get('/campaigns/:id/analytics',
  authMiddleware,
  storeAuthMiddleware,
  marketingController.getCampaignAnalytics
);

/**
 * @swagger
 * /api/marketing/email-templates:
 *   get:
 *     summary: Get email templates for store
 *     tags: [Marketing]
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
 *         description: Email templates retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/email-templates',
  authMiddleware,
  storeAuthMiddleware,
  marketingController.getEmailTemplates
);

/**
 * @swagger
 * /api/marketing/email-templates:
 *   post:
 *     summary: Create email template
 *     tags: [Marketing]
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
 *               - subject
 *               - content
 *             properties:
 *               storeId:
 *                 type: string
 *               name:
 *                 type: string
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Email template created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/email-templates',
  authMiddleware,
  storeAuthMiddleware,
  validateRequest(marketingValidation.createEmailTemplate),
  marketingController.createEmailTemplate
);

/**
 * @swagger
 * /api/marketing/email-templates/{id}:
 *   put:
 *     summary: Update email template
 *     tags: [Marketing]
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
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Email template updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Email template not found
 */
router.put('/email-templates/:id',
  authMiddleware,
  storeAuthMiddleware,
  validateRequest(marketingValidation.updateEmailTemplate),
  marketingController.updateEmailTemplate
);

/**
 * @swagger
 * /api/marketing/email-templates/{id}:
 *   delete:
 *     summary: Delete email template
 *     tags: [Marketing]
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
 *         description: Email template deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Email template not found
 */
router.delete('/email-templates/:id',
  authMiddleware,
  storeAuthMiddleware,
  marketingController.deleteEmailTemplate
);

/**
 * @swagger
 * /api/marketing/subscribers:
 *   get:
 *     summary: Get email subscribers for store
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [subscribed, unsubscribed, pending]
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
 *     responses:
 *       200:
 *         description: Subscribers retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/subscribers',
  authMiddleware,
  storeAuthMiddleware,
  marketingController.getSubscribers
);

/**
 * @swagger
 * /api/marketing/subscribers:
 *   post:
 *     summary: Add email subscriber
 *     tags: [Marketing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *               - email
 *             properties:
 *               storeId:
 *                 type: string
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Subscriber added successfully
 *       400:
 *         description: Validation error
 */
router.post('/subscribers',
  validateRequest(marketingValidation.addSubscriber),
  marketingController.addSubscriber
);

/**
 * @swagger
 * /api/marketing/subscribers/{id}/unsubscribe:
 *   post:
 *     summary: Unsubscribe from emails
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 *       404:
 *         description: Subscriber not found
 */
router.post('/subscribers/:id/unsubscribe',
  marketingController.unsubscribe
);

export default router; 