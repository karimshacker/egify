import { Request, Response } from 'express';
import { adminService } from '@/services/adminService';
import { logger } from '@/utils/logger';
import { ApiError } from '@/utils/ApiError';
import { catchAsync } from '@/utils/catchAsync';

export const adminController = {
  /**
   * Get admin dashboard data
   */
  getDashboard: catchAsync(async (req: Request, res: Response) => {
    const dashboardData = await adminService.getDashboard();

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  }),

  /**
   * Get all users (admin only)
   */
  getUsers: catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, role, status } = req.query;

    const users = await adminService.getUsers({
      page: Number(page),
      limit: Number(limit),
      role: role as string,
      status: status as string,
    });

    res.status(200).json({
      success: true,
      data: users,
    });
  }),

  /**
   * Get user details (admin only)
   */
  getUser: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await adminService.getUser(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  }),

  /**
   * Update user (admin only)
   */
  updateUser: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const updatedUser = await adminService.updateUser(id, updateData);

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  }),

  /**
   * Delete user (admin only)
   */
  deleteUser: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    await adminService.deleteUser(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  }),

  /**
   * Get all stores (admin only)
   */
  getStores: catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, status } = req.query;

    const stores = await adminService.getStores({
      page: Number(page),
      limit: Number(limit),
      status: status as string,
    });

    res.status(200).json({
      success: true,
      data: stores,
    });
  }),

  /**
   * Get store details (admin only)
   */
  getStore: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const store = await adminService.getStore(id);

    res.status(200).json({
      success: true,
      data: store,
    });
  }),

  /**
   * Update store (admin only)
   */
  updateStore: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const updatedStore = await adminService.updateStore(id, updateData);

    res.status(200).json({
      success: true,
      data: updatedStore,
      message: 'Store updated successfully',
    });
  }),

  /**
   * Delete store (admin only)
   */
  deleteStore: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    await adminService.deleteStore(id);

    res.status(200).json({
      success: true,
      message: 'Store deleted successfully',
    });
  }),

  /**
   * Get all orders (admin only)
   */
  getOrders: catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, status, storeId } = req.query;

    const orders = await adminService.getOrders({
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      storeId: storeId as string,
    });

    res.status(200).json({
      success: true,
      data: orders,
    });
  }),

  /**
   * Get order details (admin only)
   */
  getOrder: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await adminService.getOrder(id);

    res.status(200).json({
      success: true,
      data: order,
    });
  }),

  /**
   * Get platform analytics (admin only)
   */
  getAnalytics: catchAsync(async (req: Request, res: Response) => {
    const { period = 'month', startDate, endDate } = req.query;

    const analytics = await adminService.getAnalytics({
      period: period as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.status(200).json({
      success: true,
      data: analytics,
    });
  }),

  /**
   * Get platform settings (admin only)
   */
  getSettings: catchAsync(async (req: Request, res: Response) => {
    const settings = await adminService.getSettings();

    res.status(200).json({
      success: true,
      data: settings,
    });
  }),

  /**
   * Update platform settings (admin only)
   */
  updateSettings: catchAsync(async (req: Request, res: Response) => {
    const updateData = req.body;

    const updatedSettings = await adminService.updateSettings(updateData);

    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully',
    });
  }),

  /**
   * Get system health status (admin only)
   */
  getSystemHealth: catchAsync(async (req: Request, res: Response) => {
    const health = await adminService.getSystemHealth();

    res.status(200).json({
      success: true,
      data: health,
    });
  }),

  /**
   * Get system logs (admin only)
   */
  getSystemLogs: catchAsync(async (req: Request, res: Response) => {
    const { level, limit = 100 } = req.query;

    const logs = await adminService.getSystemLogs({
      level: level as string,
      limit: Number(limit),
    });

    res.status(200).json({
      success: true,
      data: logs,
    });
  }),
}; 