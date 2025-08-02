import { PrismaClient, ProductStatus } from '@prisma/client';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { CustomError } from '@/middleware/errorHandler';

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'createdAt' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number;
  images: Array<{
    url: string;
    alt: string;
  }>;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  store: {
    id: string;
    name: string;
    slug: string;
  };
  isFeatured: boolean;
  tags: string[];
  averageRating: number;
  reviewCount: number;
  inStock: boolean;
  createdAt: Date;
}

export interface StoreSearchResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  banner: string;
  status: string;
  productCount: number;
  orderCount: number;
  customerCount: number;
  averageRating: number;
  createdAt: Date;
}

export class SearchService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Search products with filters and pagination
   */
  async searchProducts(storeId: string, filters: SearchFilters = {}): Promise<SearchResult<ProductSearchResult>> {
    try {
      const {
        query,
        categoryId,
        minPrice,
        maxPrice,
        inStock,
        isFeatured,
        tags,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = filters;

      // Build where clause
      const whereClause: any = {
        storeId,
        isActive: true,
        status: ProductStatus.ACTIVE
      };

      // Text search
      if (query) {
        whereClause.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } }
        ];
      }

      // Category filter
      if (categoryId) {
        whereClause.categoryId = categoryId;
      }

      // Price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        whereClause.price = {};
        if (minPrice !== undefined) whereClause.price.gte = minPrice;
        if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
      }

      // Featured filter
      if (isFeatured !== undefined) {
        whereClause.isFeatured = isFeatured;
      }

      // Tags filter
      if (tags && tags.length > 0) {
        whereClause.tags = { hasSome: tags };
      }

      // Stock filter
      if (inStock !== undefined) {
        if (inStock) {
          whereClause.variants = {
            some: {
              inventory: { gt: 0 }
            }
          };
        } else {
          whereClause.variants = {
            every: {
              inventory: 0
            }
          };
        }
      }

      // Build order by clause
      const orderByClause: any = {};
      if (sortBy === 'popularity') {
        // For popularity, we'll order by review count (simplified)
        orderByClause.reviews = { _count: sortOrder };
      } else {
        orderByClause[sortBy] = sortOrder;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get products with related data
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where: whereClause,
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            store: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            images: {
              where: { isPrimary: true },
              select: {
                url: true,
                alt: true
              },
              take: 1
            },
            variants: {
              where: { isActive: true },
              select: { inventory: true }
            },
            reviews: {
              select: { rating: true }
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

      // Transform results
      const transformedProducts: ProductSearchResult[] = products.map(product => {
        const totalInventory = product.variants.reduce((sum, variant) => sum + variant.inventory, 0);
        const averageRating = product.reviews.length > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
          : 0;

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description || '',
          price: product.price.toNumber(),
          comparePrice: product.comparePrice?.toNumber() || 0,
          images: product.images.map(img => ({
            url: img.url,
            alt: img.alt || ''
          })),
          category: product.category ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug
          } : null,
          store: {
            id: product.store.id,
            name: product.store.name,
            slug: product.store.slug
          },
          isFeatured: product.isFeatured,
          tags: product.tags,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: product._count.reviews,
          inStock: totalInventory > 0,
          createdAt: product.createdAt
        };
      });

      const totalPages = Math.ceil(total / limit);

      return {
        items: transformedProducts,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };
    } catch (error) {
      logger.error('Error searching products:', error);
      throw new CustomError('Failed to search products', 500);
    }
  }

  /**
   * Search stores with filters and pagination
   */
  async searchStores(filters: SearchFilters = {}): Promise<SearchResult<StoreSearchResult>> {
    try {
      const {
        query,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = filters;

      // Build where clause
      const whereClause: any = {
        isActive: true,
        status: 'ACTIVE'
      };

      // Text search
      if (query) {
        whereClause.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } }
        ];
      }

      // Build order by clause
      const orderByClause: any = {};
      if (sortBy === 'popularity') {
        // For popularity, we'll order by order count
        orderByClause.orders = { _count: sortOrder };
      } else {
        orderByClause[sortBy] = sortOrder;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get stores with related data
      const [stores, total] = await Promise.all([
        this.prisma.store.findMany({
          where: whereClause,
          include: {
            _count: {
              select: {
                products: true,
                orders: true,
                customers: true
              }
            }
          },
          orderBy: orderByClause,
          skip,
          take: limit
        }),
        this.prisma.store.count({ where: whereClause })
      ]);

      // Transform results
      const transformedStores: StoreSearchResult[] = stores.map(store => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description || '',
        logo: store.logo || '',
        banner: store.banner || '',
        status: store.status,
        productCount: store._count.products,
        orderCount: store._count.orders,
        customerCount: store._count.customers,
        averageRating: 0, // TODO: Calculate from reviews
        createdAt: store.createdAt
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        items: transformedStores,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };
    } catch (error) {
      logger.error('Error searching stores:', error);
      throw new CustomError('Failed to search stores', 500);
    }
  }

  /**
   * Get search suggestions based on query
   */
  async getSearchSuggestions(query: string, storeId?: string): Promise<{
    products: Array<{ id: string; name: string; slug: string }>;
    categories: Array<{ id: string; name: string; slug: string }>;
    tags: string[];
  }> {
    try {
      const searchQuery = {
        contains: query,
        mode: 'insensitive' as const
      };

      const [products, categories] = await Promise.all([
        this.prisma.product.findMany({
          where: {
            ...(storeId && { storeId }),
            isActive: true,
            status: ProductStatus.ACTIVE,
            OR: [
              { name: searchQuery },
              { sku: searchQuery }
            ]
          },
          select: {
            id: true,
            name: true,
            slug: true
          },
          take: 5
        }),
        this.prisma.category.findMany({
          where: {
            ...(storeId && { storeId }),
            isActive: true,
            name: searchQuery
          },
          select: {
            id: true,
            name: true,
            slug: true
          },
          take: 5
        })
      ]);

      // Get unique tags from products
      const productTags = await this.prisma.product.findMany({
        where: {
          ...(storeId && { storeId }),
          isActive: true,
          status: ProductStatus.ACTIVE,
          tags: { hasSome: [query] }
        },
        select: { tags: true },
        take: 10
      });

      const tags = [...new Set(productTags.flatMap(p => p.tags))].slice(0, 5);

      return {
        products,
        categories,
        tags
      };
    } catch (error) {
      logger.error('Error getting search suggestions:', error);
      return {
        products: [],
        categories: [],
        tags: []
      };
    }
  }

  /**
   * Get trending products for a store
   */
  async getTrendingProducts(storeId: string, limit: number = 10): Promise<ProductSearchResult[]> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          storeId,
          isActive: true,
          status: ProductStatus.ACTIVE
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          images: {
            where: { isPrimary: true },
            select: {
              url: true,
              alt: true
            },
            take: 1
          },
          variants: {
            where: { isActive: true },
            select: { inventory: true }
          },
          reviews: {
            select: { rating: true }
          },
          _count: {
            select: { reviews: true }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { reviews: { _count: 'desc' } },
          { createdAt: 'desc' }
        ],
        take: limit
      });

      return products.map(product => {
        const totalInventory = product.variants.reduce((sum, variant) => sum + variant.inventory, 0);
        const averageRating = product.reviews.length > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
          : 0;

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description || '',
          price: product.price.toNumber(),
          comparePrice: product.comparePrice?.toNumber() || 0,
          images: product.images.map(img => ({
            url: img.url,
            alt: img.alt || ''
          })),
          category: product.category ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug
          } : null,
          store: {
            id: product.store.id,
            name: product.store.name,
            slug: product.store.slug
          },
          isFeatured: product.isFeatured,
          tags: product.tags,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: product._count.reviews,
          inStock: totalInventory > 0,
          createdAt: product.createdAt
        };
      });
    } catch (error) {
      logger.error('Error getting trending products:', error);
      return [];
    }
  }

  /**
   * Get search filters for a store
   */
  async getSearchFilters(storeId: string): Promise<{
    categories: Array<{ id: string; name: string; count: number }>;
    priceRanges: Array<{ min: number; max: number; count: number }>;
    tags: Array<{ name: string; count: number }>;
  }> {
    try {
      const [categories, products] = await Promise.all([
        this.prisma.category.findMany({
          where: {
            storeId,
            isActive: true
          },
          include: {
            _count: {
              select: {
                products: {
                  where: {
                    isActive: true,
                    status: ProductStatus.ACTIVE
                  }
                }
              }
            }
          }
        }),
        this.prisma.product.findMany({
          where: {
            storeId,
            isActive: true,
            status: ProductStatus.ACTIVE
          },
          select: {
            price: true,
            tags: true
          }
        })
      ]);

      // Process categories
      const categoryFilters = categories
        .filter(cat => cat._count.products > 0)
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          count: cat._count.products
        }));

      // Process price ranges
      const prices = products.map(p => p.price.toNumber()).sort((a, b) => a - b);
      const minPrice = Math.floor(prices[0] || 0);
      const maxPrice = Math.ceil(prices[prices.length - 1] || 0);
      
      const priceRanges = [
        { min: 0, max: 50, count: prices.filter(p => p <= 50).length },
        { min: 50, max: 100, count: prices.filter(p => p > 50 && p <= 100).length },
        { min: 100, max: 200, count: prices.filter(p => p > 100 && p <= 200).length },
        { min: 200, max: 500, count: prices.filter(p => p > 200 && p <= 500).length },
        { min: 500, max: maxPrice, count: prices.filter(p => p > 500).length }
      ].filter(range => range.count > 0);

      // Process tags
      const tagCounts: Record<string, number> = {};
      products.forEach(product => {
        product.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const tagFilters = Object.entries(tagCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      return {
        categories: categoryFilters,
        priceRanges,
        tags: tagFilters
      };
    } catch (error) {
      logger.error('Error getting search filters:', error);
      return {
        categories: [],
        priceRanges: [],
        tags: []
      };
    }
  }
}

export const searchService = new SearchService(); 