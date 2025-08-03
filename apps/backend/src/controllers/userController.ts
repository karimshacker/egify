import { Request, Response } from 'express';
import { userService } from '@/services/userService';
import { logger } from '@/utils/logger';
import { ApiError } from '@/utils/ApiError';
import { catchAsync } from '@/utils/catchAsync';

export const userController = {
  /**
   * Get current user profile
   */
  getProfile: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    const profile = await userService.getUserProfile(userId);
    
    res.status(200).json({
      success: true,
      data: profile,
    });
  }),

  /**
   * Update user profile
   */
  updateProfile: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    const updateData = req.body;
    const updatedProfile = await userService.updateUserProfile(userId, updateData);
    
    res.status(200).json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
    });
  }),

  /**
   * Change user password
   */
  changePassword: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(userId, currentPassword, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  }),

  /**
   * Get user addresses
   */
  getAddresses: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    const addresses = await userService.getUserAddresses(userId);
    
    res.status(200).json({
      success: true,
      data: addresses,
    });
  }),

  /**
   * Create new address
   */
  createAddress: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    const addressData = req.body;
    const newAddress = await userService.createAddress(userId, addressData);
    
    res.status(201).json({
      success: true,
      data: newAddress,
      message: 'Address created successfully',
    });
  }),

  /**
   * Update address
   */
  updateAddress: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const addressId = req.params.id;
    
    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    const updateData = req.body;
    const updatedAddress = await userService.updateAddress(userId, addressId, updateData);
    
    res.status(200).json({
      success: true,
      data: updatedAddress,
      message: 'Address updated successfully',
    });
  }),

  /**
   * Delete address
   */
  deleteAddress: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const addressId = req.params.id;
    
    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    await userService.deleteAddress(userId, addressId);
    
    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  }),

  /**
   * Get user notifications
   */
  getNotifications: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    const { page = 1, limit = 20, isRead } = req.query;
    const notifications = await userService.getUserNotifications(
      userId,
      {
        page: Number(page),
        limit: Number(limit),
        isRead: isRead !== undefined ? isRead === 'true' : undefined,
      }
    );
    
    res.status(200).json({
      success: true,
      data: notifications,
    });
  }),

  /**
   * Mark notification as read
   */
  markNotificationAsRead: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const notificationId = req.params.id;
    
    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    await userService.markNotificationAsRead(userId, notificationId);
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  }),

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    await userService.markAllNotificationsAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  }),
}; 