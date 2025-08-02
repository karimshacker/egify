import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { CustomError } from '@/middleware/errorHandler';

export interface SalesAnalytics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    totalSold: number;
    revenue: number;
  }>;
  salesByPeriod: Array<{
    period: string;
    sales: number;
    orders: number;
  }>;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageCustomerValue: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalSpent: number;
    orderCount: number;
  }>;
  customerSegments: {
    vip: number;
    regular: number;
    occasional: number;
  };
}

export interface InventoryAnalytics {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  inventoryValue: number;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    unitsSold: number;
    currentStock: number;
  }>;
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  productId?: string;
  customerId?: string;
}

export class AnalyticsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Get comprehensive sales analytics for a store
   */
  async getSalesAnalytics(storeId: string, filters: AnalyticsFilters = {}): Promise<SalesAnalytics> {
    try {
      const whereClause = {
        storeId,
        status: { in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        paymentStatus: PaymentStatus.PAID,
        ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
        ...(filters.endDate && { createdAt: { lte: filters.endDate } })
      };

      // Get total sales and orders
      const [totalSales, totalOrders] = await Promise.all([
        this.prisma.order.aggregate({
          where: whereClause,
          _sum: { total: true }
        }),
        this.prisma.order.count({ where: whereClause })
      ]);

      // Get average order value
      const averageOrderValue = totalOrders > 0 ? (totalSales._sum.total || 0) / totalOrders : 0;

      // Get top products
      const topProducts = await this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: whereClause
        },
        _sum: {
          quantity: true,
          totalPrice: true
        },
        _count: true,
        orderBy: {
          _sum: {
            totalPrice: 'desc'
          }
        },
        take: 10
      });

      const topProductsWithNames = await Promise.all(
        topProducts.map(async (item) => {
          const product = await this.prisma.product.findUnique({
            where: { id: item.productId },
            select: { name: true }
          });
          return {
            productId: item.productId,
            productName: product?.name || 'Unknown Product',
            totalSold: item._sum.quantity || 0,
            revenue: item._sum.totalPrice || 0
          };
        })
      );

      // Get sales by period (last 12 months)
      const salesByPeriod = await this.getSalesByPeriod(storeId, filters);

      // Calculate conversion rate (simplified - would need more data in real app)
      const conversionRate = 0.05; // Placeholder

      return {
        totalSales: totalSales._sum.total || 0,
        totalOrders,
        averageOrderValue,
        conversionRate,
        topProducts: topProductsWithNames,
        salesByPeriod
      };
    } catch (error) {
      logger.error('Error getting sales analytics:', error);
      throw new CustomError('Failed to get sales analytics', 500);
    }
  }

  /**
   * Get customer analytics for a store
   */
  async getCustomerAnalytics(storeId: string, filters: AnalyticsFilters = {}): Promise<CustomerAnalytics> {
    try {
      const whereClause = {
        storeId,
        isActive: true,
        ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
        ...(filters.endDate && { createdAt: { lte: filters.endDate } })
      };

      // Get customer counts
      const [totalCustomers, newCustomers] = await Promise.all([
        this.prisma.customer.count({ where: whereClause }),
        this.prisma.customer.count({
          where: {
            ...whereClause,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ]);

      // Get top customers by spending
      const topCustomers = await this.prisma.order.groupBy({
        by: ['customerId'],
        where: {
          storeId,
          status: { in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
          paymentStatus: PaymentStatus.PAID
        },
        _sum: { total: true },
        _count: true,
        orderBy: {
          _sum: {
            total: 'desc'
          }
        },
        take: 10
      });

      const topCustomersWithNames = await Promise.all(
        topCustomers.map(async (customer) => {
          const customerData = await this.prisma.customer.findUnique({
            where: { id: customer.customerId },
            select: { firstName: true, lastName: true }
          });
          return {
            customerId: customer.customerId,
            customerName: `${customerData?.firstName || ''} ${customerData?.lastName || ''}`.trim(),
            totalSpent: customer._sum.total || 0,
            orderCount: customer._count
          };
        })
      );

      // Calculate average customer value
      const totalRevenue = topCustomers.reduce((sum, customer) => sum + (customer._sum.total || 0), 0);
      const averageCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

      // Calculate returning customers (customers with more than 1 order)
      const returningCustomers = topCustomers.filter(customer => customer._count > 1).length;

      // Customer segments (simplified)
      const customerSegments = {
        vip: topCustomers.filter(customer => (customer._sum.total || 0) > 1000).length,
        regular: topCustomers.filter(customer => (customer._sum.total || 0) > 100 && (customer._sum.total || 0) <= 1000).length,
        occasional: totalCustomers - topCustomers.filter(customer => (customer._sum.total || 0) > 100).length
      };

      return {
        totalCustomers,
        newCustomers,
        returningCustomers,
        averageCustomerValue,
        topCustomers: topCustomersWithNames,
        customerSegments
      };
    } catch (error) {
      logger.error('Error getting customer analytics:', error);
      throw new CustomError('Failed to get customer analytics', 500);
    }
  }

  /**
   * Get inventory analytics for a store
   */
  async getInventoryAnalytics(storeId: string): Promise<InventoryAnalytics> {
    try {
      // Get product counts
      const [totalProducts, lowStockProducts, outOfStockProducts] = await Promise.all([
        this.prisma.product.count({
          where: { storeId, isActive: true }
        }),
        this.prisma.productVariant.count({
          where: {
            product: { storeId, isActive: true },
            inventory: { lte: 5 },
            inventory: { gt: 0 }
          }
        }),
        this.prisma.productVariant.count({
          where: {
            product: { storeId, isActive: true },
            inventory: 0
          }
        })
      ]);

      // Get top selling products
      const topSellingProducts = await this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            storeId,
            status: { in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] }
          }
        },
        _sum: { quantity: true },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 10
      });

      const topSellingWithStock = await Promise.all(
        topSellingProducts.map(async (item) => {
          const product = await this.prisma.product.findUnique({
            where: { id: item.productId },
            select: { name: true }
          });

          const currentStock = await this.prisma.productVariant.aggregate({
            where: { productId: item.productId },
            _sum: { inventory: true }
          });

          return {
            productId: item.productId,
            productName: product?.name || 'Unknown Product',
            unitsSold: item._sum.quantity || 0,
            currentStock: currentStock._sum.inventory || 0
          };
        })
      );

      // Calculate inventory value (simplified)
      const inventoryValue = await this.prisma.productVariant.aggregate({
        where: {
          product: { storeId, isActive: true }
        },
        _sum: {
          inventory: true
        }
      });

      return {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        inventoryValue: inventoryValue._sum.inventory || 0,
        topSellingProducts: topSellingWithStock
      };
    } catch (error) {
      logger.error('Error getting inventory analytics:', error);
      throw new CustomError('Failed to get inventory analytics', 500);
    }
  }

  /**
   * Get sales data by period (monthly for last 12 months)
   */
  private async getSalesByPeriod(storeId: string, filters: AnalyticsFilters = {}): Promise<Array<{ period: string; sales: number; orders: number }>> {
    const periods = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const [sales, orders] = await Promise.all([
        this.prisma.order.aggregate({
          where: {
            storeId,
            status: { in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
            paymentStatus: PaymentStatus.PAID,
            createdAt: { gte: periodStart, lte: periodEnd }
          },
          _sum: { total: true }
        }),
        this.prisma.order.count({
          where: {
            storeId,
            status: { in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
            paymentStatus: PaymentStatus.PAID,
            createdAt: { gte: periodStart, lte: periodEnd }
          }
        })
      ]);

      periods.push({
        period: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        sales: sales._sum.total || 0,
        orders
      });
    }

    return periods;
  }

  /**
   * Get dashboard summary for a store
   */
  async getDashboardSummary(storeId: string): Promise<{
    totalSales: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    recentOrders: any[];
    lowStockAlerts: any[];
  }> {
    try {
      const [totalSales, totalOrders, totalCustomers, totalProducts] = await Promise.all([
        this.prisma.order.aggregate({
          where: {
            storeId,
            status: { in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
            paymentStatus: PaymentStatus.PAID,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
          },
          _sum: { total: true }
        }),
        this.prisma.order.count({
          where: {
            storeId,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        }),
        this.prisma.customer.count({
          where: { storeId, isActive: true }
        }),
        this.prisma.product.count({
          where: { storeId, isActive: true }
        })
      ]);

      // Get recent orders
      const recentOrders = await this.prisma.order.findMany({
        where: { storeId },
        include: {
          customer: {
            select: { firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      // Get low stock alerts
      const lowStockAlerts = await this.prisma.productVariant.findMany({
        where: {
          product: { storeId, isActive: true },
          inventory: { lte: 5 },
          inventory: { gt: 0 }
        },
        include: {
          product: {
            select: { name: true, sku: true }
          }
        },
        take: 10
      });

      return {
        totalSales: totalSales._sum.total || 0,
        totalOrders,
        totalCustomers,
        totalProducts,
        recentOrders,
        lowStockAlerts
      };
    } catch (error) {
      logger.error('Error getting dashboard summary:', error);
      throw new CustomError('Failed to get dashboard summary', 500);
    }
  }
}

export const analyticsService = new AnalyticsService(); 