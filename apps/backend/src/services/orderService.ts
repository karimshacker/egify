import { PrismaClient, Order, OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { CustomError } from '@/middleware/errorHandler';
import { 
  OrderCreateData, 
  OrderUpdateData, 
  OrderSearchParams,
  OrderListResponse,
  OrderWithDetails,
  OrderItemData,
  OrderAnalytics
} from '@/types';

export class OrderService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Create a new order
   */
  async createOrder(storeId: string, customerId: string, data: OrderCreateData): Promise<OrderWithDetails> {
    try {
      // Validate products and calculate totals
      const orderItems = await this.validateOrderItems(storeId, data.items);
      const totals = this.calculateOrderTotals(orderItems, data.shippingCost || 0, data.taxAmount || 0);

      // Create order with items
      const order = await this.prisma.order.create({
        data: {
          orderNumber: await this.generateOrderNumber(storeId),
          storeId,
          customerId,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          shippingCost: totals.shippingCost,
          discountAmount: totals.discountAmount,
          total: totals.total,
          currency: data.currency || 'USD',
          notes: data.notes,
          customerNotes: data.customerNotes,
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress,
          shippingMethod: data.shippingMethod,
          paymentMethod: data.paymentMethod,
          items: {
            create: orderItems.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              productName: item.productName,
              variantName: item.variantName,
              productSku: item.productSku,
              variantSku: item.variantSku
            }))
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              settings: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1
                  }
                }
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              }
            }
          }
        }
      });

      // Update product inventory
      await this.updateInventoryForOrder(orderItems);

      logger.info(`Order created: ${order.orderNumber} for customer: ${customerId}`);

      return order;
    } catch (error) {
      logger.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<OrderWithDetails | null> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              address: true
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              settings: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1
                  }
                }
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              }
            }
          },
          payments: {
            orderBy: { createdAt: 'desc' }
          },
          shipping: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return order;
    } catch (error) {
      logger.error('Error getting order by ID:', error);
      throw error;
    }
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(storeId: string, orderNumber: string): Promise<OrderWithDetails | null> {
    try {
      const order = await this.prisma.order.findFirst({
        where: { 
          storeId,
          orderNumber,
          isActive: true
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              address: true
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              settings: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1
                  }
                }
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              }
            }
          },
          payments: {
            orderBy: { createdAt: 'desc' }
          },
          shipping: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return order;
    } catch (error) {
      logger.error('Error getting order by number:', error);
      throw error;
    }
  }

  /**
   * Get orders by store
   */
  async getOrdersByStore(storeId: string, params: OrderSearchParams = {}): Promise<OrderListResponse> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        paymentStatus, 
        search, 
        startDate, 
        endDate,
        sortBy = 'createdAt', 
        sortOrder = 'desc'
      } = params;
      
      const skip = (page - 1) * limit;

      const where: Prisma.OrderWhereInput = {
        storeId,
        isActive: true
      };

      if (status) {
        where.status = status;
      }

      if (paymentStatus) {
        where.paymentStatus = paymentStatus;
      }

      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { customer: { 
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }},
          { items: {
            some: {
              productName: { contains: search, mode: 'insensitive' }
            }
          }}
        ];
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const orderBy: Prisma.OrderOrderByWithRelationInput = {};
      orderBy[sortBy as keyof Order] = sortOrder;

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            },
            items: {
              take: 3,
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: {
                      where: { isPrimary: true },
                      take: 1
                    }
                  }
                }
              }
            },
            _count: {
              select: { items: true }
            }
          }
        }),
        this.prisma.order.count({ where })
      ]);

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting orders by store:', error);
      throw error;
    }
  }

  /**
   * Get orders by customer
   */
  async getOrdersByCustomer(customerId: string, params: OrderSearchParams = {}): Promise<OrderListResponse> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        paymentStatus,
        sortBy = 'createdAt', 
        sortOrder = 'desc'
      } = params;
      
      const skip = (page - 1) * limit;

      const where: Prisma.OrderWhereInput = {
        customerId,
        isActive: true
      };

      if (status) {
        where.status = status;
      }

      if (paymentStatus) {
        where.paymentStatus = paymentStatus;
      }

      const orderBy: Prisma.OrderOrderByWithRelationInput = {};
      orderBy[sortBy as keyof Order] = sortOrder;

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            store: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: {
                      where: { isPrimary: true },
                      take: 1
                    }
                  }
                }
              }
            }
          }
        }),
        this.prisma.order.count({ where })
      ]);

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting orders by customer:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<OrderWithDetails> {
    try {
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          notes: notes ? `${order.notes || ''}\n${new Date().toISOString()}: ${notes}`.trim() : order.notes
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              settings: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1
                  }
                }
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              }
            }
          }
        }
      });

      logger.info(`Order status updated: ${orderId} to ${status}`);

      return order;
    } catch (error) {
      logger.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus, paymentData?: any): Promise<OrderWithDetails> {
    try {
      const updateData: Prisma.OrderUpdateInput = {
        paymentStatus
      };

      if (paymentData) {
        updateData.payments = {
          create: {
            amount: paymentData.amount,
            method: paymentData.method,
            transactionId: paymentData.transactionId,
            status: paymentData.status,
            gateway: paymentData.gateway,
            metadata: paymentData.metadata || {}
          }
        };
      }

      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              settings: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1
                  }
                }
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              }
            }
          },
          payments: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      logger.info(`Payment status updated: ${orderId} to ${paymentStatus}`);

      return order;
    } catch (error) {
      logger.error('Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<OrderWithDetails> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!order) {
        throw new CustomError('Order not found', 404);
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new CustomError('Order is already cancelled', 400);
      }

      if ([OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.status)) {
        throw new CustomError('Cannot cancel shipped or delivered order', 400);
      }

      // Restore inventory
      await this.restoreInventoryForOrder(order.items);

      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          notes: reason ? `${order.notes || ''}\n${new Date().toISOString()}: Cancelled - ${reason}`.trim() : order.notes
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              settings: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1
                  }
                }
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              }
            }
          }
        }
      });

      logger.info(`Order cancelled: ${orderId}, reason: ${reason}`);

      return updatedOrder;
    } catch (error) {
      logger.error('Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Get order analytics
   */
  async getOrderAnalytics(storeId: string, period: string = '30d'): Promise<OrderAnalytics> {
    try {
      const startDate = this.getStartDate(period);

      const [
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus,
        revenueByDay,
        topProducts
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
            paymentStatus: PaymentStatus.PAID
          },
          _sum: { total: true }
        }),

        // Average order value
        this.prisma.order.aggregate({
          where: {
            storeId,
            createdAt: { gte: startDate },
            paymentStatus: PaymentStatus.PAID
          },
          _avg: { total: true }
        }),

        // Orders by status
        this.prisma.order.groupBy({
          by: ['status'],
          where: {
            storeId,
            createdAt: { gte: startDate }
          },
          _count: { id: true }
        }),

        // Revenue by day
        this.prisma.order.groupBy({
          by: ['createdAt'],
          where: {
            storeId,
            createdAt: { gte: startDate },
            paymentStatus: PaymentStatus.PAID
          },
          _sum: { total: true },
          orderBy: { createdAt: 'asc' }
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
          take: 10
        })
      ]);

      return {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        averageOrderValue: averageOrderValue._avg.total || 0,
        ordersByStatus: ordersByStatus.map(status => ({
          status: status.status,
          count: status._count.id
        })),
        revenueByDay: revenueByDay.map(day => ({
          date: day.createdAt,
          revenue: day._sum.total || 0
        })),
        topProducts
      };
    } catch (error) {
      logger.error('Error getting order analytics:', error);
      throw error;
    }
  }

  /**
   * Validate order items and get product details
   */
  private async validateOrderItems(storeId: string, items: OrderItemData[]): Promise<any[]> {
    const validatedItems = [];

    for (const item of items) {
      const product = await this.prisma.product.findFirst({
        where: {
          id: item.productId,
          storeId,
          isActive: true,
          status: 'PUBLISHED'
        },
        include: {
          variants: item.variantId ? {
            where: { id: item.variantId, isActive: true }
          } : undefined
        }
      });

      if (!product) {
        throw new CustomError(`Product not found: ${item.productId}`, 404);
      }

      let variant = null;
      let unitPrice = product.price;
      let productSku = product.sku;
      let variantSku = null;

      if (item.variantId) {
        variant = product.variants?.[0];
        if (!variant) {
          throw new CustomError(`Product variant not found: ${item.variantId}`, 404);
        }
        unitPrice = variant.price;
        variantSku = variant.sku;
      }

      // Check inventory
      const availableInventory = variant ? variant.inventory : (product.inventory || 0);
      if (product.trackInventory && availableInventory < item.quantity) {
        throw new CustomError(`Insufficient inventory for product: ${product.name}`, 400);
      }

      validatedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
        productName: product.name,
        variantName: variant?.name,
        productSku,
        variantSku
      });
    }

    return validatedItems;
  }

  /**
   * Calculate order totals
   */
  private calculateOrderTotals(items: any[], shippingCost: number, taxAmount: number): {
    subtotal: number;
    taxAmount: number;
    shippingCost: number;
    discountAmount: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const total = subtotal + taxAmount + shippingCost;

    return {
      subtotal,
      taxAmount,
      shippingCost,
      discountAmount: 0, // TODO: Implement discount logic
      total
    };
  }

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(storeId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const baseNumber = `${year}${month}${day}`;
    
    // Get count of orders for today
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    const orderCount = await this.prisma.order.count({
      where: {
        storeId,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    const sequence = String(orderCount + 1).padStart(4, '0');
    return `ORD-${baseNumber}-${sequence}`;
  }

  /**
   * Update inventory for order
   */
  private async updateInventoryForOrder(items: any[]): Promise<void> {
    for (const item of items) {
      if (item.variantId) {
        await this.prisma.productVariant.update({
          where: { id: item.variantId },
          data: {
            inventory: {
              decrement: item.quantity
            }
          }
        });
      } else {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            inventory: {
              decrement: item.quantity
            }
          }
        });
      }
    }
  }

  /**
   * Restore inventory for cancelled order
   */
  private async restoreInventoryForOrder(items: any[]): Promise<void> {
    for (const item of items) {
      if (item.variantId) {
        await this.prisma.productVariant.update({
          where: { id: item.variantId },
          data: {
            inventory: {
              increment: item.quantity
            }
          }
        });
      } else {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            inventory: {
              increment: item.quantity
            }
          }
        });
      }
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

export const orderService = new OrderService(); 