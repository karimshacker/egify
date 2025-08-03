import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

export interface SalesAnalytics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  salesByPeriod: Array<{
    period: string;
    sales: number;
    orders: number;
  }>;
}

export interface ProductAnalytics {
  topProducts: Array<{
    productId: string;
    productName: string;
    totalSold: number;
    revenue: number;
    quantity: number;
  }>;
  lowStockProducts: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    threshold: number;
  }>;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalSpent: number;
    orderCount: number;
  }>;
  customerRetention: number;
}

export interface OrderAnalytics {
  orderStatusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  averageProcessingTime: number;
  orderTrends: Array<{
    period: string;
    orders: number;
    revenue: number;
  }>;
}

export class AnalyticsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get comprehensive sales analytics for a store
   */
  async getSalesAnalytics(storeId: string, period: string = '30d'): Promise<SalesAnalytics> {
    try {
      const startDate = this.getStartDate(period);
      
      // Get total sales and orders
      const [totalSales, totalOrders] = await Promise.all([
        this.prisma.order.aggregate({
          where: {
            storeId,
            createdAt: { gte: startDate },
            status: { not: 'CANCELLED' }
          },
          _sum: { total: true }
        }),
        this.prisma.order.count({
          where: {
            storeId,
            createdAt: { gte: startDate },
            status: { not: 'CANCELLED' }
          }
        })
      ]);

      // Get sales by period (daily, weekly, monthly)
      const salesByPeriod = await this.getSalesByPeriod(storeId, startDate, period);

      const totalSalesAmount = totalSales._sum.total || 0;
      const averageOrderValue = totalOrders > 0 ? totalSalesAmount / totalOrders : 0;

      return {
        totalSales: totalSalesAmount,
        totalOrders,
        averageOrderValue,
        salesByPeriod
      };
    } catch (error) {
      logger.error('Error getting sales analytics:', error);
      throw error;
    }
  }

  /**
   * Get product analytics
   */
  async getProductAnalytics(storeId: string, period: string = '30d'): Promise<ProductAnalytics> {
    try {
      const startDate = this.getStartDate(period);

      // Get top selling products
      const topProducts = await this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            storeId,
            createdAt: { gte: startDate },
            status: { not: 'CANCELLED' }
          }
        },
        _sum: {
          totalPrice: true,
          quantity: true
        },
        orderBy: {
          _sum: {
            totalPrice: 'desc'
          }
        },
        take: 10
      });

      // Get product details for top products
      const topProductsWithDetails = await Promise.all(
        topProducts.map(async (item) => {
          const product = await this.prisma.product.findUnique({
            where: { id: item.productId },
            select: { name: true }
          });

          return {
            productId: item.productId,
            productName: product?.name || 'Unknown Product',
            totalSold: item._sum.totalPrice || 0,
            revenue: item._sum.totalPrice || 0,
            quantity: item._sum.quantity || 0
          };
        })
      );

      // Get low stock products
      const lowStockProducts = await this.prisma.productVariant.findMany({
        where: {
          product: { storeId },
          inventory: {
            lte: this.prisma.product.fields.lowStockThreshold
          }
        },
        include: {
          product: {
            select: { name: true, lowStockThreshold: true }
          }
        }
      });

      const lowStockFormatted = lowStockProducts.map(variant => ({
        productId: variant.productId,
        productName: variant.product.name,
        currentStock: variant.inventory,
        threshold: variant.product.lowStockThreshold
      }));

      return {
        topProducts: topProductsWithDetails,
        lowStockProducts: lowStockFormatted
      };
    } catch (error) {
      logger.error('Error getting product analytics:', error);
      throw error;
    }
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(storeId: string, period: string = '30d'): Promise<CustomerAnalytics> {
    try {
      const startDate = this.getStartDate(period);

      // Get total customers
      const totalCustomers = await this.prisma.customer.count({
        where: { storeId }
      });

      // Get new customers in period
      const newCustomers = await this.prisma.customer.count({
        where: {
          storeId,
          createdAt: { gte: startDate }
        }
      });

      // Get top customers by spending
      const topCustomers = await this.prisma.order.groupBy({
        by: ['customerId'],
        where: {
          storeId,
          createdAt: { gte: startDate },
          status: { not: 'CANCELLED' }
        },
        _sum: { total: true },
        _count: { id: true },
        orderBy: {
          _sum: { total: 'desc' }
        },
        take: 10
      });

      // Get customer details for top customers
      const topCustomersWithDetails = await Promise.all(
        topCustomers.map(async (order) => {
          const customer = await this.prisma.customer.findUnique({
            where: { id: order.customerId },
            select: { firstName: true, lastName: true }
          });

          return {
            customerId: order.customerId,
            customerName: `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim(),
            totalSpent: order._sum.total || 0,
            orderCount: order._count.id
          };
        })
      );

      // Calculate customer retention (simplified)
      const customerRetention = await this.calculateCustomerRetention(storeId, startDate);

      return {
        totalCustomers,
        newCustomers,
        topCustomers: topCustomersWithDetails,
        customerRetention
      };
    } catch (error) {
      logger.error('Error getting customer analytics:', error);
      throw error;
    }
  }

  /**
   * Get order analytics
   */
  async getOrderAnalytics(storeId: string, period: string = '30d'): Promise<OrderAnalytics> {
    try {
      const startDate = this.getStartDate(period);

      // Get order status distribution
      const orderStatusDistribution = await this.prisma.order.groupBy({
        by: ['status'],
        where: {
          storeId,
          createdAt: { gte: startDate }
        },
        _count: { id: true }
      });

      const totalOrders = orderStatusDistribution.reduce((sum, item) => sum + item._count.id, 0);

      const statusDistribution = orderStatusDistribution.map(item => ({
        status: item.status,
        count: item._count.id,
        percentage: totalOrders > 0 ? (item._count.id / totalOrders) * 100 : 0
      }));

      // Calculate average processing time
      const averageProcessingTime = await this.calculateAverageProcessingTime(storeId, startDate);

      // Get order trends
      const orderTrends = await this.getOrderTrends(storeId, startDate, period);

      return {
        orderStatusDistribution: statusDistribution,
        averageProcessingTime,
        orderTrends
      };
    } catch (error) {
      logger.error('Error getting order analytics:', error);
      throw error;
    }
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(storeId: string): Promise<any> {
    try {
      const [salesAnalytics, productAnalytics, customerAnalytics, orderAnalytics] = await Promise.all([
        this.getSalesAnalytics(storeId, '30d'),
        this.getProductAnalytics(storeId, '30d'),
        this.getCustomerAnalytics(storeId, '30d'),
        this.getOrderAnalytics(storeId, '30d')
      ]);

      return {
        sales: salesAnalytics,
        products: productAnalytics,
        customers: customerAnalytics,
        orders: orderAnalytics
      };
    } catch (error) {
      logger.error('Error getting dashboard summary:', error);
      throw error;
    }
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(storeId: string, period: string = '12m'): Promise<Array<{
    period: string;
    revenue: number;
    orders: number;
    customers: number;
  }>> {
    try {
      const startDate = this.getStartDate(period);
      const groupBy = this.getGroupByClause(period);

      const trends = await this.prisma.order.groupBy({
        by: [groupBy],
        where: {
          storeId,
          createdAt: { gte: startDate },
          status: { not: 'CANCELLED' }
        },
        _sum: { total: true },
        _count: { id: true, customerId: true },
        orderBy: { [groupBy]: 'asc' }
      });

      return trends.map(item => ({
        period: item[groupBy] as string,
        revenue: item._sum.total || 0,
        orders: item._count.id,
        customers: item._count.customerId
      }));
    } catch (error) {
      logger.error('Error getting revenue trends:', error);
      throw error;
    }
  }

  /**
   * Get inventory analytics
   */
  async getInventoryAnalytics(storeId: string): Promise<any> {
    try {
      const [totalProducts, lowStockCount, outOfStockCount] = await Promise.all([
        this.prisma.product.count({ where: { storeId } }),
        this.prisma.productVariant.count({
          where: {
            product: { storeId },
            inventory: {
              lte: this.prisma.product.fields.lowStockThreshold,
              gt: 0
            }
          }
        }),
        this.prisma.productVariant.count({
          where: {
            product: { storeId },
            inventory: 0
          }
        })
      ]);

      return {
        totalProducts,
        lowStockCount,
        outOfStockCount,
        stockHealth: totalProducts > 0 ? ((totalProducts - lowStockCount - outOfStockCount) / totalProducts) * 100 : 0
      };
    } catch (error) {
      logger.error('Error getting inventory analytics:', error);
      throw error;
    }
  }

  // Private helper methods

  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '6m':
        return new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
      case '12m':
        return new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private getGroupByClause(period: string): string {
    switch (period) {
      case '7d':
      case '30d':
        return 'createdAt';
      case '90d':
      case '6m':
      case '12m':
        return 'createdAt';
      default:
        return 'createdAt';
    }
  }

  private async getSalesByPeriod(storeId: string, startDate: Date, period: string): Promise<Array<{
    period: string;
    sales: number;
    orders: number;
  }>> {
    const groupBy = this.getGroupByClause(period);
    
    const salesData = await this.prisma.order.groupBy({
      by: [groupBy],
      where: {
        storeId,
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' }
      },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { [groupBy]: 'asc' }
    });

    return salesData.map(item => ({
      period: item[groupBy] as string,
      sales: item._sum.total || 0,
      orders: item._count.id
    }));
  }

  private async calculateCustomerRetention(storeId: string, startDate: Date): Promise<number> {
    // Simplified customer retention calculation
    const totalCustomers = await this.prisma.customer.count({ where: { storeId } });
    const repeatCustomers = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: {
        storeId,
        createdAt: { gte: startDate }
      },
      _count: { id: true },
      having: {
        id: { _count: { gt: 1 } }
      }
    });

    return totalCustomers > 0 ? (repeatCustomers.length / totalCustomers) * 100 : 0;
  }

  private async calculateAverageProcessingTime(storeId: string, startDate: Date): Promise<number> {
    const orders = await this.prisma.order.findMany({
      where: {
        storeId,
        createdAt: { gte: startDate },
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        paidAt: { not: null }
      },
      select: {
        createdAt: true,
        paidAt: true
      }
    });

    if (orders.length === 0) return 0;

    const totalTime = orders.reduce((sum, order) => {
      if (order.paidAt) {
        return sum + (order.paidAt.getTime() - order.createdAt.getTime());
      }
      return sum;
    }, 0);

    return totalTime / orders.length / (1000 * 60 * 60); // Convert to hours
  }

  private async getOrderTrends(storeId: string, startDate: Date, period: string): Promise<Array<{
    period: string;
    orders: number;
    revenue: number;
  }>> {
    const groupBy = this.getGroupByClause(period);
    
    const trends = await this.prisma.order.groupBy({
      by: [groupBy],
      where: {
        storeId,
        createdAt: { gte: startDate }
      },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { [groupBy]: 'asc' }
    });

    return trends.map(item => ({
      period: item[groupBy] as string,
      orders: item._count.id,
      revenue: item._sum.total || 0
    }));
  }
}

export const analyticsService = new AnalyticsService(); 