import { PrismaClient, Customer, Prisma } from '@prisma/client';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { CustomError } from '@/middleware/errorHandler';
import { 
  CustomerCreateData, 
  CustomerUpdateData, 
  CustomerSearchParams,
  CustomerListResponse,
  CustomerWithDetails,
  CustomerAnalytics
} from '@/types';

export class CustomerService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Create a new customer
   */
  async createCustomer(storeId: string, data: CustomerCreateData): Promise<CustomerWithDetails> {
    try {
      // Check if customer with same email exists in store
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          storeId,
          email: data.email.toLowerCase(),
          isActive: true
        }
      });

      if (existingCustomer) {
        throw new CustomError('Customer with this email already exists in your store', 409);
      }

      // Create customer
      const customer = await this.prisma.customer.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase(),
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          storeId,
          isActive: true,
          isVerified: false,
          address: {
            create: data.address
          },
          preferences: data.preferences || {},
          tags: data.tags || []
        },
        include: {
          address: true,
          _count: {
            select: {
              orders: true,
              reviews: true
            }
          }
        }
      });

      logger.info(`Customer created: ${customer.email} in store: ${storeId}`);

      return customer;
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(customerId: string): Promise<CustomerWithDetails | null> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId, isActive: true },
        include: {
          address: true,
          orders: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
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
              }
            }
          },
          reviews: {
            take: 5,
            orderBy: { createdAt: 'desc' },
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
            select: {
              orders: true,
              reviews: true
            }
          }
        }
      });

      return customer;
    } catch (error) {
      logger.error('Error getting customer by ID:', error);
      throw error;
    }
  }

  /**
   * Get customer by email
   */
  async getCustomerByEmail(storeId: string, email: string): Promise<CustomerWithDetails | null> {
    try {
      const customer = await this.prisma.customer.findFirst({
        where: {
          storeId,
          email: email.toLowerCase(),
          isActive: true
        },
        include: {
          address: true,
          orders: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
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
              }
            }
          },
          _count: {
            select: {
              orders: true,
              reviews: true
            }
          }
        }
      });

      return customer;
    } catch (error) {
      logger.error('Error getting customer by email:', error);
      throw error;
    }
  }

  /**
   * Get customers by store
   */
  async getCustomersByStore(storeId: string, params: CustomerSearchParams = {}): Promise<CustomerListResponse> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        tags, 
        isVerified,
        sortBy = 'createdAt', 
        sortOrder = 'desc'
      } = params;
      
      const skip = (page - 1) * limit;

      const where: Prisma.CustomerWhereInput = {
        storeId,
        isActive: true
      };

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (tags && tags.length > 0) {
        where.tags = {
          hasSome: tags
        };
      }

      if (isVerified !== undefined) {
        where.isVerified = isVerified;
      }

      const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
      orderBy[sortBy as keyof Customer] = sortOrder;

      const [customers, total] = await Promise.all([
        this.prisma.customer.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            address: true,
            _count: {
              select: {
                orders: true,
                reviews: true
              }
            }
          }
        }),
        this.prisma.customer.count({ where })
      ]);

      return {
        customers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting customers by store:', error);
      throw error;
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(customerId: string, data: CustomerUpdateData): Promise<CustomerWithDetails> {
    try {
      const updateData: Prisma.CustomerUpdateInput = {};

      // Update customer fields
      if (data.firstName !== undefined) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
      if (data.gender !== undefined) updateData.gender = data.gender;
      if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
      if (data.preferences !== undefined) updateData.preferences = data.preferences;
      if (data.tags !== undefined) updateData.tags = data.tags;

      // Check email uniqueness if being updated
      if (data.email) {
        const customer = await this.prisma.customer.findUnique({
          where: { id: customerId }
        });

        if (customer) {
          const emailExists = await this.prisma.customer.findFirst({
            where: {
              storeId: customer.storeId,
              email: data.email.toLowerCase(),
              id: { not: customerId },
              isActive: true
            }
          });

          if (emailExists) {
            throw new CustomError('Customer with this email already exists in your store', 409);
          }
        }
        updateData.email = data.email.toLowerCase();
      }

      const customer = await this.prisma.customer.update({
        where: { id: customerId },
        data: updateData,
        include: {
          address: true,
          _count: {
            select: {
              orders: true,
              reviews: true
            }
          }
        }
      });

      logger.info(`Customer updated: ${customerId}`);

      return customer;
    } catch (error) {
      logger.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Update customer address
   */
  async updateCustomerAddress(customerId: string, addressData: any): Promise<CustomerWithDetails> {
    try {
      const customer = await this.prisma.customer.update({
        where: { id: customerId },
        data: {
          address: {
            upsert: {
              create: addressData,
              update: addressData
            }
          }
        },
        include: {
          address: true,
          _count: {
            select: {
              orders: true,
              reviews: true
            }
          }
        }
      });

      logger.info(`Customer address updated: ${customerId}`);

      return customer;
    } catch (error) {
      logger.error('Error updating customer address:', error);
      throw error;
    }
  }

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(customerId: string): Promise<void> {
    try {
      await this.prisma.customer.update({
        where: { id: customerId },
        data: { isActive: false }
      });

      logger.info(`Customer deleted: ${customerId}`);
    } catch (error) {
      logger.error('Error deleting customer:', error);
      throw error;
    }
  }

  /**
   * Get customer orders
   */
  async getCustomerOrders(customerId: string, params: any = {}): Promise<any> {
    try {
      const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.OrderWhereInput = {
        customerId,
        isActive: true
      };

      if (status) {
        where.status = status;
      }

      const orderBy: Prisma.OrderOrderByWithRelationInput = {};
      orderBy[sortBy as keyof any] = sortOrder;

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
      logger.error('Error getting customer orders:', error);
      throw error;
    }
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(storeId: string, period: string = '30d'): Promise<CustomerAnalytics> {
    try {
      const startDate = this.getStartDate(period);

      const [
        totalCustomers,
        newCustomers,
        activeCustomers,
        customersByGender,
        topCustomers,
        customerGrowth
      ] = await Promise.all([
        // Total customers
        this.prisma.customer.count({
          where: { storeId, isActive: true }
        }),

        // New customers in period
        this.prisma.customer.count({
          where: {
            storeId,
            isActive: true,
            createdAt: { gte: startDate }
          }
        }),

        // Active customers (with orders in period)
        this.prisma.customer.count({
          where: {
            storeId,
            isActive: true,
            orders: {
              some: {
                createdAt: { gte: startDate }
              }
            }
          }
        }),

        // Customers by gender
        this.prisma.customer.groupBy({
          by: ['gender'],
          where: { storeId, isActive: true },
          _count: { id: true }
        }),

        // Top customers by order value
        this.prisma.customer.findMany({
          where: {
            storeId,
            isActive: true,
            orders: {
              some: {
                createdAt: { gte: startDate },
                paymentStatus: 'PAID'
              }
            }
          },
          include: {
            orders: {
              where: {
                createdAt: { gte: startDate },
                paymentStatus: 'PAID'
              }
            },
            _count: {
              select: { orders: true }
            }
          },
          orderBy: {
            orders: {
              _sum: { total: 'desc' }
            }
          },
          take: 10
        }),

        // Customer growth by day
        this.prisma.customer.groupBy({
          by: ['createdAt'],
          where: {
            storeId,
            isActive: true,
            createdAt: { gte: startDate }
          },
          _count: { id: true },
          orderBy: { createdAt: 'asc' }
        })
      ]);

      return {
        totalCustomers,
        newCustomers,
        activeCustomers,
        customersByGender: customersByGender.map(gender => ({
          gender: gender.gender,
          count: gender._count.id
        })),
        topCustomers: topCustomers.map(customer => ({
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0),
          orderCount: customer._count.orders
        })),
        customerGrowth: customerGrowth.map(day => ({
          date: day.createdAt,
          count: day._count.id
        }))
      };
    } catch (error) {
      logger.error('Error getting customer analytics:', error);
      throw error;
    }
  }

  /**
   * Add customer tag
   */
  async addCustomerTag(customerId: string, tag: string): Promise<CustomerWithDetails> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        throw new CustomError('Customer not found', 404);
      }

      const updatedTags = customer.tags.includes(tag) 
        ? customer.tags 
        : [...customer.tags, tag];

      const updatedCustomer = await this.prisma.customer.update({
        where: { id: customerId },
        data: { tags: updatedTags },
        include: {
          address: true,
          _count: {
            select: {
              orders: true,
              reviews: true
            }
          }
        }
      });

      logger.info(`Tag added to customer: ${customerId}, tag: ${tag}`);

      return updatedCustomer;
    } catch (error) {
      logger.error('Error adding customer tag:', error);
      throw error;
    }
  }

  /**
   * Remove customer tag
   */
  async removeCustomerTag(customerId: string, tag: string): Promise<CustomerWithDetails> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        throw new CustomError('Customer not found', 404);
      }

      const updatedTags = customer.tags.filter(t => t !== tag);

      const updatedCustomer = await this.prisma.customer.update({
        where: { id: customerId },
        data: { tags: updatedTags },
        include: {
          address: true,
          _count: {
            select: {
              orders: true,
              reviews: true
            }
          }
        }
      });

      logger.info(`Tag removed from customer: ${customerId}, tag: ${tag}`);

      return updatedCustomer;
    } catch (error) {
      logger.error('Error removing customer tag:', error);
      throw error;
    }
  }

  /**
   * Search customers
   */
  async searchCustomers(storeId: string, query: string): Promise<CustomerWithDetails[]> {
    try {
      const customers = await this.prisma.customer.findMany({
        where: {
          storeId,
          isActive: true,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 10,
        include: {
          address: true,
          _count: {
            select: {
              orders: true,
              reviews: true
            }
          }
        }
      });

      return customers;
    } catch (error) {
      logger.error('Error searching customers:', error);
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

export const customerService = new CustomerService(); 