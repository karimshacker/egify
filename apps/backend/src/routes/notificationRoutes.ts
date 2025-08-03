import { Router } from 'express';
import { notificationController } from '@/controllers/notificationController';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Get user notifications
router.get('/', notificationController.getUserNotifications);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Get notification settings
router.get('/settings', notificationController.getSettings);

// Update notification settings
router.put('/settings', notificationController.updateSettings);

export default router; 