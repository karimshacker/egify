import { PrismaClient, Store, StoreStatus, Prisma } from '@prisma/client';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { CustomError } from '@/middleware/errorHandler';
import { 
  StoreCreateData, 
  StoreUpdateData, 
  StoreSettingsData,
  StoreAnalytics,
  StoreWithDetails,
  StoreListResponse,
  StoreSearchParams
} from '@/types';

export class StoreService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Create a new store
   */
  async createStore(ownerId: string, data: StoreCreateData): Promise<StoreWithDetails> {
    try {
      // Check if user already has a store with the same name
      const existingStore = await this.prisma.store.findFirst({
        where: {
          ownerId,
          name: data.name,
          isActive: true
        }
      });

      if (existingStore) {
        throw new CustomError('You already have a store with this name', 409);
      }

      // Check if slug is available
      const slugExists = await this.prisma.store.findUnique({
        where: { slug: data.slug }
      });

      if (slugExists) {
        throw new CustomError('Store slug already exists', 409);
      }

      // Create store with settings
      const store = await this.prisma.store.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          logo: data.logo,
          banner: data.banner,
          ownerId,
          status: StoreStatus.DRAFT,
          isActive: true,
          settings: {
            create: {
              currency: data.currency || 'USD',
              language: data.language || 'en',
              timezone: data.timezone || 'UTC',
              taxRate: data.taxRate || 0,
              shippingEnabled: data.shippingEnabled || false,
              pickupEnabled: data.pickupEnabled || true,
              deliveryEnabled: data.deliveryEnabled || false,
              autoAcceptOrders: data.autoAcceptOrders || false,
              requireCustomerApproval: data.requireCustomerApproval || false,
              notificationSettings: data.notificationSettings || {
                email: true,
                sms: false,
                push: true
              }
            }
          },
          address: {
            create: data.address
          }
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true
            }
          },
          settings: true,
          address: true,
          _count: {
            select: {
              products: true,
              orders: true,
              customers: true
            }
          }
        }
      });

      logger.info(`Store created: ${store.name} by user: ${ownerId}`);

      return store;
    } catch (error) {
      logger.error('Error creating store:', error);
      throw error;
    }
  }

  /**
   * Get store by ID
   */
  async getStoreById(storeId: string): Promise<StoreWithDetails | null> {
    try {
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true
            }
          },
          settings: true,
          address: true,
          _count: {
            select: {
              products: true,
              orders: true,
              customers: true
            }
          }
        }
      });

      return store;
    } catch (error) {
      logger.error('Error getting store by ID:', error);
      throw error;
    }
  }

  /**
   * Get store by slug
   */
  async getStoreBySlug(slug: string): Promise<StoreWithDetails | null> {
    try {
      const store = await this.prisma.store.findUnique({
        where: { slug, isActive: true },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true
            }
          },
          settings: true,
          address: true,
          _count: {
            select: {
              products: true,
              orders: true,
              customers: true
            }
          }
        }
      });

      return store;
    } catch (error) {
      logger.error('Error getting store by slug:', error);
      throw error;
    }
  }

  /**
   * Get stores by owner
   */
  async getStoresByOwner(ownerId: string, params: StoreSearchParams = {}): Promise<StoreListResponse> {
    try {
      const { page = 1, limit = 10, status, search } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.StoreWhereInput = {
        ownerId,
        isActive: true
      };

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [stores, total] = await Promise.all([
        this.prisma.store.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            settings: true,
            address: true,
            _count: {
              select: {
                products: true,
                orders: true,
                customers: true
              }
            }
          }
        }),
        this.prisma.store.count({ where })
      ]);

      return {
        stores,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting stores by owner:', error);
      throw error;
    }
  }

  /**
   * Update store
   */
  async updateStore(storeId: string, data: StoreUpdateData): Promise<StoreWithDetails> {
    try {
      const updateData: Prisma.StoreUpdateInput = {};

      // Update store fields
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.logo !== undefined) updateData.logo = data.logo;
      if (data.banner !== undefined) updateData.banner = data.banner;
      if (data.status !== undefined) updateData.status = data.status;

      // Check slug uniqueness if being updated
      if (data.slug) {
        const slugExists = await this.prisma.store.findFirst({
          where: {
            slug: data.slug,
            id: { not: storeId }
          }
        });

        if (slugExists) {
          throw new CustomError('Store slug already exists', 409);
        }
        updateData.slug = data.slug;
      }

      const store = await this.prisma.store.update({
        where: { id: storeId },
        data: updateData,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true
            }
          },
          settings: true,
          address: true,
          _count: {
            select: {
              products: true,
              orders: true,
              customers: true
            }
          }
        }
      });

      logger.info(`Store updated: ${storeId}`);

      return store;
    } catch (error) {
      logger.error('Error updating store:', error);
      throw error;
    }
  }

  /**
   * Update store settings
   */
  async updateStoreSettings(storeId: string, data: StoreSettingsData): Promise<StoreWithDetails> {
    try {
      const settingsUpdateData: Prisma.StoreSettingsUpdateInput = {};

      // Update settings fields
      if (data.currency !== undefined) settingsUpdateData.currency = data.currency;
      if (data.language !== undefined) settingsUpdateData.language = data.language;
      if (data.timezone !== undefined) settingsUpdateData.timezone = data.timezone;
      if (data.taxRate !== undefined) settingsUpdateData.taxRate = data.taxRate;
      if (data.shippingEnabled !== undefined) settingsUpdateData.shippingEnabled = data.shippingEnabled;
      if (data.pickupEnabled !== undefined) settingsUpdateData.pickupEnabled = data.pickupEnabled;
      if (data.deliveryEnabled !== undefined) settingsUpdateData.deliveryEnabled = data.deliveryEnabled;
      if (data.autoAcceptOrders !== undefined) settingsUpdateData.autoAcceptOrders = data.autoAcceptOrders;
      if (data.requireCustomerApproval !== undefined) settingsUpdateData.requireCustomerApproval = data.requireCustomerApproval;
      if (data.notificationSettings !== undefined) settingsUpdateData.notificationSettings = data.notificationSettings;

      const store = await this.prisma.store.update({
        where: { id: storeId },
        data: {
          settings: {
            update: settingsUpdateData
          }
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true
            }
          },
          settings: true,
          address: true,
          _count: {
            select: {
              products: true,
              orders: true,
              customers: true
            }
          }
        }
      });

      logger.info(`Store settings updated: ${storeId}`);

      return store;
    } catch (error) {
      logger.error('Error updating store settings:', error);
      throw error;
    }
  }

  /**
   * Delete store (soft delete)
   */
  async deleteStore(storeId: string): Promise<void> {
    try {
      await this.prisma.store.update({
        where: { id: storeId },
        data: { isActive: false }
      });

      logger.info(`Store deleted: ${storeId}`);
    } catch (error) {
      logger.error('Error deleting store:', error);
      throw error;
    }
  }

  /**
   * Get store analytics
   */
  async getStoreAnalytics(storeId: string, period: string = '30d'): Promise<StoreAnalytics> {
    try {
      const startDate = this.getStartDate(period);

      const [
        totalOrders,
        totalRevenue,
        totalProducts,
        totalCustomers,
        recentOrders,
        topProducts,
        revenueByDay
      ] = await Promise.all([
        // Total orders in period
        this.prisma.order.count({
          where: {
            storeId,
            createdAt: { gte: startDate }
          }
        }),

        // Total revenue in period
        this.prisma.order.aggregate({
          where: {
            storeId,
            createdAt: { gte: startDate },
            status: { in: ['COMPLETED', 'DELIVERED'] }
          },
          _sum: { total: true }
        }),

        // Total products
        this.prisma.product.count({
          where: { storeId, isActive: true }
        }),

        // Total customers
        this.prisma.customer.count({
          where: { storeId }
        }),

        // Recent orders
        this.prisma.order.findMany({
          where: { storeId },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        }),

        // Top products
        this.prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: {
              storeId,
              createdAt: { gte: startDate }
            }
          },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5
        }),

        // Revenue by day
        this.prisma.order.groupBy({
          by: ['createdAt'],
          where: {
            storeId,
            createdAt: { gte: startDate },
            status: { in: ['COMPLETED', 'DELIVERED'] }
          },
          _sum: { total: true },
          orderBy: { createdAt: 'asc' }
        })
      ]);

      return {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        totalProducts,
        totalCustomers,
        recentOrders,
        topProducts,
        revenueByDay: revenueByDay.map(day => ({
          date: day.createdAt,
          revenue: day._sum.total || 0
        }))
      };
    } catch (error) {
      logger.error('Error getting store analytics:', error);
      throw error;
    }
  }

  /**
   * Search stores
   */
  async searchStores(params: StoreSearchParams): Promise<StoreListResponse> {
    try {
      const { page = 1, limit = 10, search, category, location, status } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.StoreWhereInput = {
        isActive: true,
        status: StoreStatus.PUBLISHED
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (category) {
        where.categories = {
          some: {
            name: { contains: category, mode: 'insensitive' }
          }
        };
      }

      if (location) {
        where.address = {
          city: { contains: location, mode: 'insensitive' }
        };
      }

      if (status) {
        where.status = status;
      }

      const [stores, total] = await Promise.all([
        this.prisma.store.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            settings: true,
            address: true,
            _count: {
              select: {
                products: true,
                orders: true,
                customers: true
              }
            }
          }
        }),
        this.prisma.store.count({ where })
      ]);

      return {
        stores,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error searching stores:', error);
      throw error;
    }
  }

  /**
   * Get store categories
   */
  async getStoreCategories(storeId: string): Promise<any[]> {
    try {
      const categories = await this.prisma.category.findMany({
        where: {
          stores: {
            some: { id: storeId }
          }
        },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      return categories;
    } catch (error) {
      logger.error('Error getting store categories:', error);
      throw error;
    }
  }

  /**
   * Add category to store
   */
  async addCategoryToStore(storeId: string, categoryId: string): Promise<void> {
    try {
      await this.prisma.store.update({
        where: { id: storeId },
        data: {
          categories: {
            connect: { id: categoryId }
          }
        }
      });

      logger.info(`Category ${categoryId} added to store ${storeId}`);
    } catch (error) {
      logger.error('Error adding category to store:', error);
      throw error;
    }
  }

  /**
   * Remove category from store
   */
  async removeCategoryFromStore(storeId: string, categoryId: string): Promise<void> {
    try {
      await this.prisma.store.update({
        where: { id: storeId },
        data: {
          categories: {
            disconnect: { id: categoryId }
          }
        }
      });

      logger.info(`Category ${categoryId} removed from store ${storeId}`);
    } catch (error) {
      logger.error('Error removing category from store:', error);
      throw error;
    }
  }

  /**
   * Get start date for analytics period
   */
  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}

export const storeService = new StoreService(); 