import { PrismaClient, User, Store, Order, UserRole, StoreStatus, OrderStatus } from '@prisma/client';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export interface AdminDashboard {
  totalUsers: number;
  totalStores: number;
  totalOrders: number;
  totalRevenue: number;
  recentUsers: User[];
  recentStores: Store[];
  recentOrders: Order[];
  revenueChart: Array<{ date: string; revenue: number }>;
  userGrowthChart: Array<{ date: string; users: number }>;
}

export interface UserFilters {
  page: number;
  limit: number;
  role?: string;
  status?: string;
}

export interface StoreFilters {
  page: number;
  limit: number;
  status?: string;
}

export interface OrderFilters {
  page: number;
  limit: number;
  status?: string;
  storeId?: string;
}

export interface AnalyticsFilters {
  period: string;
  startDate?: string;
  endDate?: string;
}

export interface PlatformSettings {
  platformName: string;
  platformDescription: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  maxStoresPerUser: number;
  maxProductsPerStore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemHealth {
  database: boolean;
  redis: boolean;
  email: boolean;
  storage: boolean;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface SystemLog {
  timestamp: Date;
  level: string;
  message: string;
  metadata: any;
}

export const adminService = {
  /**
   * Get admin dashboard data
   */
  async getDashboard(): Promise<AdminDashboard> {
    const [
      totalUsers,
      totalStores,
      totalOrders,
      totalRevenue,
      recentUsers,
      recentStores,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.order.count(),
      this.calculateTotalRevenue(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.store.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Generate mock chart data
    const revenueChart = this.generateRevenueChartData();
    const userGrowthChart = this.generateUserGrowthChartData();

    return {
      totalUsers,
      totalStores,
      totalOrders,
      totalRevenue,
      recentUsers,
      recentStores,
      recentOrders,
      revenueChart,
      userGrowthChart,
    };
  },

  /**
   * Get all users with pagination and filters
   */
  async getUsers(filters: UserFilters): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit, role, status } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (role) {
      whereClause.role = role as UserRole;
    }
    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user;
  },

  /**
   * Update user
   */
  async updateUser(userId: string, updateData: any): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const allowedFields = ['role', 'isActive', 'emailVerified'];
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as any);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: filteredData,
    });

    logger.info(`Admin updated user: ${userId}`);
    return updatedUser;
  },

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: false,
        deletedAt: new Date()
      },
    });

    logger.info(`Admin deleted user: ${userId}`);
  },

  /**
   * Get all stores with pagination and filters
   */
  async getStores(filters: StoreFilters): Promise<{
    stores: Store[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit, status } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (status) {
      whereClause.status = status as StoreStatus;
    }

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      }),
      prisma.store.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      stores,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },

  /**
   * Get store by ID
   */
  async getStore(storeId: string): Promise<Store> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        settings: true,
      },
    });

    if (!store) {
      throw new ApiError(404, 'Store not found');
    }

    return store;
  },

  /**
   * Update store
   */
  async updateStore(storeId: string, updateData: any): Promise<Store> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new ApiError(404, 'Store not found');
    }

    const allowedFields = ['status', 'isActive'];
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as any);

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: filteredData,
    });

    logger.info(`Admin updated store: ${storeId}`);
    return updatedStore;
  },

  /**
   * Delete store
   */
  async deleteStore(storeId: string): Promise<void> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new ApiError(404, 'Store not found');
    }

    await prisma.store.update({
      where: { id: storeId },
      data: { 
        isActive: false,
        deletedAt: new Date()
      },
    });

    logger.info(`Admin deleted store: ${storeId}`);
  },

  /**
   * Get all orders with pagination and filters
   */
  async getOrders(filters: OrderFilters): Promise<{
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit, status, storeId } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (status) {
      whereClause.status = status as OrderStatus;
    }
    if (storeId) {
      whereClause.storeId = storeId;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    return order;
  },

  /**
   * Get platform analytics
   */
  async getAnalytics(filters: AnalyticsFilters): Promise<any> {
    // In a real implementation, this would query analytics data
    // For now, return mock analytics data
    const analytics = {
      period: filters.period,
      revenue: {
        total: 125000.00,
        change: 12.5,
        chart: this.generateRevenueChartData(),
      },
      orders: {
        total: 1250,
        change: 8.3,
        chart: this.generateOrderChartData(),
      },
      users: {
        total: 850,
        change: 15.2,
        chart: this.generateUserGrowthChartData(),
      },
      stores: {
        total: 45,
        change: 5.7,
        chart: this.generateStoreChartData(),
      },
    };

    return analytics;
  },

  /**
   * Get platform settings
   */
  async getSettings(): Promise<PlatformSettings> {
    // In a real implementation, this would query a settings table
    // For now, return mock settings
    const settings: PlatformSettings = {
      platformName: 'Egify Platform',
      platformDescription: 'A comprehensive SaaS e-commerce platform',
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerificationRequired: true,
      maxStoresPerUser: 5,
      maxProductsPerStore: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return settings;
  },

  /**
   * Update platform settings
   */
  async updateSettings(updateData: any): Promise<PlatformSettings> {
    // In a real implementation, this would update a settings table
    logger.info('Platform settings updated:', updateData);

    return {
      ...this.getSettings(),
      ...updateData,
      updatedAt: new Date(),
    };
  },

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    // In a real implementation, this would check actual system health
    const health: SystemHealth = {
      database: true,
      redis: true,
      email: true,
      storage: true,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpuUsage: 0, // Would need to calculate this
    };

    return health;
  },

  /**
   * Get system logs
   */
  async getSystemLogs(filters: { level?: string; limit: number }): Promise<SystemLog[]> {
    // In a real implementation, this would query actual log files
    // For now, return mock logs
    const logs: SystemLog[] = [
      {
        timestamp: new Date(),
        level: 'info',
        message: 'System started successfully',
        metadata: { service: 'api' },
      },
      {
        timestamp: new Date(Date.now() - 60000),
        level: 'info',
        message: 'Database connection established',
        metadata: { service: 'database' },
      },
    ];

    return logs.slice(0, filters.limit);
  },

  // Helper methods
  private async calculateTotalRevenue(): Promise<number> {
    const result = await prisma.order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        paymentStatus: 'PAID',
      },
    });

    return Number(result._sum.total || 0);
  },

  private generateRevenueChartData(): Array<{ date: string; revenue: number }> {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.random() * 10000 + 1000,
      });
    }
    return data;
  },

  private generateUserGrowthChartData(): Array<{ date: string; users: number }> {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        users: Math.floor(Math.random() * 50) + 10,
      });
    }
    return data;
  },

  private generateOrderChartData(): Array<{ date: string; orders: number }> {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        orders: Math.floor(Math.random() * 100) + 20,
      });
    }
    return data;
  },

  private generateStoreChartData(): Array<{ date: string; stores: number }> {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        stores: Math.floor(Math.random() * 10) + 2,
      });
    }
    return data;
  },
}; 