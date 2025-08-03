import { PrismaClient, User, Address, Notification, AddressType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  profile?: {
    id: string;
    avatar: string | null;
    bio: string | null;
    dateOfBirth: Date | null;
    address: any;
    preferences: any;
  } | null;
}

export interface AddressData {
  type: AddressType;
  firstName?: string;
  lastName?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export interface NotificationFilters {
  page: number;
  limit: number;
  isRead?: boolean;
}

export const userService = {
  /**
   * Get user profile with related data
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user as UserProfile;
  },

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updateData: Partial<User>): Promise<UserProfile> {
    const allowedFields = ['firstName', 'lastName', 'phone'];
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as any);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: filteredData,
      include: {
        profile: true,
      },
    });

    logger.info(`User profile updated: ${userId}`);
    return updatedUser as UserProfile;
  },

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    logger.info(`Password changed for user: ${userId}`);
  },

  /**
   * Get user addresses
   */
  async getUserAddresses(userId: string): Promise<Address[]> {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });

    return addresses;
  },

  /**
   * Create new address
   */
  async createAddress(userId: string, addressData: AddressData): Promise<Address> {
    // If this is set as default, unset other default addresses
    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        ...addressData,
        userId,
      },
    });

    logger.info(`Address created for user: ${userId}`);
    return newAddress;
  },

  /**
   * Update address
   */
  async updateAddress(userId: string, addressId: string, updateData: Partial<AddressData>): Promise<Address> {
    // Verify address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existingAddress) {
      throw new ApiError(404, 'Address not found');
    }

    // If this is set as default, unset other default addresses
    if (updateData.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: updateData,
    });

    logger.info(`Address updated for user: ${userId}`);
    return updatedAddress;
  },

  /**
   * Delete address
   */
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    // Verify address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existingAddress) {
      throw new ApiError(404, 'Address not found');
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    logger.info(`Address deleted for user: ${userId}`);
  },

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId: string, filters: NotificationFilters): Promise<{
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit, isRead } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = { userId };
    if (isRead !== undefined) {
      whereClause.isRead = isRead;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    logger.info(`Notification marked as read: ${notificationId}`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    logger.info(`All notifications marked as read for user: ${userId}`);
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  },

  /**
   * Update user last login
   */
  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  },

  /**
   * Verify user email
   */
  async verifyEmail(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        emailVerified: true, 
        emailVerifiedAt: new Date() 
      },
    });

    logger.info(`Email verified for user: ${userId}`);
  },

  /**
   * Deactivate user account
   */
  async deactivateAccount(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: false,
        deletedAt: new Date()
      },
    });

    logger.info(`Account deactivated for user: ${userId}`);
  },
}; 