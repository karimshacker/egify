import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { notificationService } from '@/services/notificationService';

export class NotificationController {
  /**
   * Get user notifications
   * GET /api/notifications
   */
  getUserNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    const notifications = await notificationService.getUserNotifications(
      userId,
      Number(limit)
    );

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: notifications.length
        }
      }
    });
  });

  /**
   * Mark notification as read
   * PUT /api/notifications/:id/read
   */
  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    await notificationService.markNotificationAsRead(id);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  });

  /**
   * Mark all notifications as read
   * PUT /api/notifications/read-all
   */
  markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    // Get all unread notifications for the user
    const unreadCount = await notificationService.getUnreadNotificationCount(userId);
    
    if (unreadCount > 0) {
      // This would require a bulk update method in the service
      // For now, we'll implement it in the service
      await notificationService.markAllNotificationsAsRead(userId);
    }

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  });

  /**
   * Get unread notification count
   * GET /api/notifications/unread-count
   */
  getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const count = await notificationService.getUnreadNotificationCount(userId);

    res.status(200).json({
      success: true,
      data: { count }
    });
  });

  /**
   * Delete notification
   * DELETE /api/notifications/:id
   */
  deleteNotification = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    await notificationService.deleteNotification(id, userId);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  });

  /**
   * Get notification settings
   * GET /api/notifications/settings
   */
  getSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const settings = await notificationService.getUserNotificationSettings(userId);

    res.status(200).json({
      success: true,
      data: settings
    });
  });

  /**
   * Update notification settings
   * PUT /api/notifications/settings
   */
  updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const settings = req.body;

    await notificationService.updateUserNotificationSettings(userId, settings);

    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully'
    });
  });
}

export const notificationController = new NotificationController(); 