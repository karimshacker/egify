import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isActive?: boolean;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'createdAt' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CustomerSearchFilters {
  query?: string;
  isActive?: boolean;
  isVerified?: boolean;
  tags?: string[];
  sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: SearchFilters | CustomerSearchFilters;
}

export class SearchService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Search products with advanced filtering
   */
  async searchProducts(storeId: string, filters: SearchFilters = {}): Promise<SearchResult<any>> {
    try {
      const {
        query,
        categoryId,
        minPrice,
        maxPrice,
        inStock,
        isActive = true,
        tags,
        sortBy = 'name',
        sortOrder = 'asc',
        page = 1,
        limit = 20
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {
        storeId,
        isActive,
        deletedAt: null
      };

      // Add search query
      if (query) {
        whereClause.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } }
        ];
      }

      // Add category filter
      if (categoryId) {
        whereClause.categoryId = categoryId;
      }

      // Add price filters
      if (minPrice !== undefined || maxPrice !== undefined) {
        whereClause.price = {};
        if (minPrice !== undefined) whereClause.price.gte = minPrice;
        if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
      }

      // Add tags filter
      if (tags && tags.length > 0) {
        whereClause.tags = { hasSome: tags };
      }

      // Add stock filter
      if (inStock !== undefined) {
        whereClause.variants = {
          some: {
            inventory: inStock ? { gt: 0 } : { equals: 0 }
          }
        };
      }

      // Build order by clause
      const orderByClause: any = {};
      switch (sortBy) {
        case 'price':
          orderByClause.price = sortOrder;
          break;
        case 'createdAt':
          orderByClause.createdAt = sortOrder;
          break;
        case 'popularity':
          // TODO: Implement popularity-based sorting
          orderByClause.createdAt = 'desc';
          break;
        default:
          orderByClause.name = sortOrder;
      }

      // Execute search
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where: whereClause,
          include: {
            category: {
              select: { name: true, slug: true }
            },
            variants: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                price: true,
                inventory: true,
                attributes: true
              }
            },
            images: {
              where: { isPrimary: true },
              select: { url: true, alt: true }
            },
            _count: {
              select: { reviews: true }
            }
          },
          orderBy: orderByClause,
          skip,
          take: limit
        }),
        this.prisma.product.count({ where: whereClause })
      ]);

      // Process results
      const processedProducts = products.map(product => ({
        ...product,
        averageRating: this.calculateAverageRating(product.reviews || []),
        reviewCount: product._count.reviews,
        primaryImage: product.images[0]?.url || null,
        minPrice: Math.min(...product.variants.map(v => Number(v.price))),
        maxPrice: Math.max(...product.variants.map(v => Number(v.price))),
        totalStock: product.variants.reduce((sum, v) => sum + v.inventory, 0)
      }));

      return {
        data: processedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters
      };
    } catch (error) {
      logger.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Search customers with filtering
   */
  async searchCustomers(storeId: string, filters: CustomerSearchFilters = {}): Promise<SearchResult<any>> {
    try {
      const {
        query,
        isActive = true,
        isVerified,
        tags,
        sortBy = 'firstName',
        sortOrder = 'asc',
        page = 1,
        limit = 20
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {
        storeId,
        isActive,
        deletedAt: null
      };

      // Add search query
      if (query) {
        whereClause.OR = [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } }
        ];
      }

      // Add verification filter
      if (isVerified !== undefined) {
        whereClause.isVerified = isVerified;
      }

      // Add tags filter
      if (tags && tags.length > 0) {
        whereClause.tags = { hasSome: tags };
      }

      // Build order by clause
      const orderByClause: any = {};
      switch (sortBy) {
        case 'lastName':
          orderByClause.lastName = sortOrder;
          break;
        case 'email':
          orderByClause.email = sortOrder;
          break;
        case 'createdAt':
          orderByClause.createdAt = sortOrder;
          break;
        default:
          orderByClause.firstName = sortOrder;
      }

      // Execute search
      const [customers, total] = await Promise.all([
        this.prisma.customer.findMany({
          where: whereClause,
          include: {
            address: true,
            _count: {
              select: { orders: true, reviews: true }
            }
          },
          orderBy: orderByClause,
          skip,
          take: limit
        }),
        this.prisma.customer.count({ where: whereClause })
      ]);

      // Process results
      const processedCustomers = customers.map(customer => ({
        ...customer,
        fullName: `${customer.firstName} ${customer.lastName}`,
        orderCount: customer._count.orders,
        reviewCount: customer._count.reviews
      }));

      return {
        data: processedCustomers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters
      };
    } catch (error) {
      logger.error('Error searching customers:', error);
      throw error;
    }
  }

  /**
   * Search orders with filtering
   */
  async searchOrders(storeId: string, filters: any = {}): Promise<SearchResult<any>> {
    try {
      const {
        query,
        status,
        paymentStatus,
        minTotal,
        maxTotal,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {
        storeId
      };

      // Add search query
      if (query) {
        whereClause.OR = [
          { orderNumber: { contains: query, mode: 'insensitive' } },
          { customer: { firstName: { contains: query, mode: 'insensitive' } } },
          { customer: { lastName: { contains: query, mode: 'insensitive' } } },
          { customer: { email: { contains: query, mode: 'insensitive' } } }
        ];
      }

      // Add status filters
      if (status) whereClause.status = status;
      if (paymentStatus) whereClause.paymentStatus = paymentStatus;

      // Add total filters
      if (minTotal !== undefined || maxTotal !== undefined) {
        whereClause.total = {};
        if (minTotal !== undefined) whereClause.total.gte = minTotal;
        if (maxTotal !== undefined) whereClause.total.lte = maxTotal;
      }

      // Add date filters
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt.gte = new Date(startDate);
        if (endDate) whereClause.createdAt.lte = new Date(endDate);
      }

      // Build order by clause
      const orderByClause: any = {};
      switch (sortBy) {
        case 'orderNumber':
          orderByClause.orderNumber = sortOrder;
          break;
        case 'total':
          orderByClause.total = sortOrder;
          break;
        case 'status':
          orderByClause.status = sortOrder;
          break;
        default:
          orderByClause.createdAt = sortOrder;
      }

      // Execute search
      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where: whereClause,
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
              include: {
                product: {
                  select: { name: true, sku: true }
                },
                variant: {
                  select: { name: true, sku: true }
                }
              }
            },
            payments: {
              select: { amount: true, status: true, method: true }
            }
          },
          orderBy: orderByClause,
          skip,
          take: limit
        }),
        this.prisma.order.count({ where: whereClause })
      ]);

      return {
        data: orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters
      };
    } catch (error) {
      logger.error('Error searching orders:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSearchSuggestions(storeId: string, query: string, type: 'products' | 'customers' = 'products'): Promise<string[]> {
    try {
      if (!query || query.length < 2) return [];

      const suggestions: string[] = [];

      if (type === 'products') {
        // Get product name suggestions
        const products = await this.prisma.product.findMany({
          where: {
            storeId,
            isActive: true,
            name: { contains: query, mode: 'insensitive' }
          },
          select: { name: true },
          take: 10
        });

        suggestions.push(...products.map(p => p.name));

        // Get category suggestions
        const categories = await this.prisma.category.findMany({
          where: {
            storeId,
            isActive: true,
            name: { contains: query, mode: 'insensitive' }
          },
          select: { name: true },
          take: 5
        });

        suggestions.push(...categories.map(c => c.name));
      } else {
        // Get customer name suggestions
        const customers = await this.prisma.customer.findMany({
          where: {
            storeId,
            isActive: true,
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
            ]
          },
          select: { firstName: true, lastName: true, email: true },
          take: 10
        });

        customers.forEach(customer => {
          if (customer.firstName) suggestions.push(customer.firstName);
          if (customer.lastName) suggestions.push(customer.lastName);
          if (customer.email) suggestions.push(customer.email);
        });
      }

      // Remove duplicates and limit results
      return [...new Set(suggestions)].slice(0, 10);
    } catch (error) {
      logger.error('Error getting search suggestions:', error);
      return [];
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearchTerms(storeId: string, limit: number = 10): Promise<string[]> {
    try {
      // This would typically come from a search analytics table
      // For now, return some common terms
      return [
        'electronics',
        'clothing',
        'books',
        'home',
        'garden',
        'sports',
        'toys',
        'beauty',
        'health',
        'automotive'
      ].slice(0, limit);
    } catch (error) {
      logger.error('Error getting popular search terms:', error);
      return [];
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(storeId: string, period: string = '30d'): Promise<any> {
    try {
      // This would typically analyze search patterns and popular terms
      // For now, return basic structure
      return {
        totalSearches: 0,
        popularTerms: [],
        searchTrends: [],
        conversionRate: 0
      };
    } catch (error) {
      logger.error('Error getting search analytics:', error);
      throw error;
    }
  }

  // Private helper methods

  private calculateAverageRating(reviews: any[]): number {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / reviews.length) * 10) / 10;
  }
}

export const searchService = new SearchService(); 