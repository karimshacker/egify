import { PrismaClient, Product, ProductStatus, Prisma } from '@prisma/client';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { CustomError } from '@/middleware/errorHandler';
import { 
  ProductCreateData, 
  ProductUpdateData, 
  ProductSearchParams,
  ProductListResponse,
  ProductWithDetails,
  ProductVariantData,
  ProductImageData
} from '@/types';

export class ProductService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Create a new product
   */
  async createProduct(storeId: string, data: ProductCreateData): Promise<ProductWithDetails> {
    try {
      // Check if product with same SKU exists in store
      if (data.sku) {
        const existingProduct = await this.prisma.product.findFirst({
          where: {
            storeId,
            sku: data.sku,
            isActive: true
          }
        });

        if (existingProduct) {
          throw new CustomError('Product with this SKU already exists in your store', 409);
        }
      }

      // Create product with variants and images
      const product = await this.prisma.product.create({
        data: {
          name: data.name,
          description: data.description,
          sku: data.sku,
          barcode: data.barcode,
          price: data.price,
          comparePrice: data.comparePrice,
          costPrice: data.costPrice,
          weight: data.weight,
          dimensions: data.dimensions,
          categoryId: data.categoryId,
          storeId,
          status: ProductStatus.DRAFT,
          isActive: true,
          isFeatured: data.isFeatured || false,
          isDigital: data.isDigital || false,
          requiresShipping: data.requiresShipping !== false,
          trackInventory: data.trackInventory !== false,
          lowStockThreshold: data.lowStockThreshold || 5,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          seoKeywords: data.seoKeywords,
          tags: data.tags || [],
          variants: {
            create: data.variants?.map(variant => ({
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
              comparePrice: variant.comparePrice,
              costPrice: variant.costPrice,
              weight: variant.weight,
              dimensions: variant.dimensions,
              inventory: variant.inventory || 0,
              isActive: true,
              attributes: variant.attributes || {}
            })) || []
          },
          images: {
            create: data.images?.map((image, index) => ({
              url: image.url,
              alt: image.alt,
              isPrimary: index === 0,
              sortOrder: index
            })) || []
          }
        },
        include: {
          category: true,
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' }
          },
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          _count: {
            select: {
              orderItems: true,
              reviews: true
            }
          }
        }
      });

      logger.info(`Product created: ${product.name} in store: ${storeId}`);

      return product;
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: string): Promise<ProductWithDetails | null> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId, isActive: true },
        include: {
          category: true,
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              settings: true
            }
          },
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' }
          },
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          reviews: {
            where: { isApproved: true },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              customer: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            }
          },
          _count: {
            select: {
              orderItems: true,
              reviews: true
            }
          }
        }
      });

      return product;
    } catch (error) {
      logger.error('Error getting product by ID:', error);
      throw error;
    }
  }

  /**
   * Get products by store
   */
  async getProductsByStore(storeId: string, params: ProductSearchParams = {}): Promise<ProductListResponse> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        categoryId, 
        search, 
        minPrice, 
        maxPrice, 
        sortBy = 'createdAt', 
        sortOrder = 'desc',
        isFeatured,
        isDigital
      } = params;
      
      const skip = (page - 1) * limit;

      const where: Prisma.ProductWhereInput = {
        storeId,
        isActive: true
      };

      if (status) {
        where.status = status;
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } }
        ];
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      if (isFeatured !== undefined) {
        where.isFeatured = isFeatured;
      }

      if (isDigital !== undefined) {
        where.isDigital = isDigital;
      }

      const orderBy: Prisma.ProductOrderByWithRelationInput = {};
      orderBy[sortBy as keyof Product] = sortOrder;

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            category: true,
            variants: {
              where: { isActive: true },
              take: 1
            },
            images: {
              where: { isPrimary: true },
              take: 1
            },
            _count: {
              select: {
                orderItems: true,
                reviews: true
              }
            }
          }
        }),
        this.prisma.product.count({ where })
      ]);

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting products by store:', error);
      throw error;
    }
  }

  /**
   * Update product
   */
  async updateProduct(productId: string, data: ProductUpdateData): Promise<ProductWithDetails> {
    try {
      const updateData: Prisma.ProductUpdateInput = {};

      // Update product fields
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.sku !== undefined) updateData.sku = data.sku;
      if (data.barcode !== undefined) updateData.barcode = data.barcode;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.comparePrice !== undefined) updateData.comparePrice = data.comparePrice;
      if (data.costPrice !== undefined) updateData.costPrice = data.costPrice;
      if (data.weight !== undefined) updateData.weight = data.weight;
      if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
      if (data.isDigital !== undefined) updateData.isDigital = data.isDigital;
      if (data.requiresShipping !== undefined) updateData.requiresShipping = data.requiresShipping;
      if (data.trackInventory !== undefined) updateData.trackInventory = data.trackInventory;
      if (data.lowStockThreshold !== undefined) updateData.lowStockThreshold = data.lowStockThreshold;
      if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle;
      if (data.seoDescription !== undefined) updateData.seoDescription = data.seoDescription;
      if (data.seoKeywords !== undefined) updateData.seoKeywords = data.seoKeywords;
      if (data.tags !== undefined) updateData.tags = data.tags;

      // Check SKU uniqueness if being updated
      if (data.sku) {
        const product = await this.prisma.product.findUnique({
          where: { id: productId }
        });

        if (product) {
          const skuExists = await this.prisma.product.findFirst({
            where: {
              storeId: product.storeId,
              sku: data.sku,
              id: { not: productId },
              isActive: true
            }
          });

          if (skuExists) {
            throw new CustomError('Product with this SKU already exists in your store', 409);
          }
        }
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id: productId },
        data: updateData,
        include: {
          category: true,
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' }
          },
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          _count: {
            select: {
              orderItems: true,
              reviews: true
            }
          }
        }
      });

      logger.info(`Product updated: ${productId}`);

      return updatedProduct;
    } catch (error) {
      logger.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      await this.prisma.product.update({
        where: { id: productId },
        data: { isActive: false }
      });

      logger.info(`Product deleted: ${productId}`);
    } catch (error) {
      logger.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Add product variant
   */
  async addProductVariant(productId: string, data: ProductVariantData): Promise<any> {
    try {
      const variant = await this.prisma.productVariant.create({
        data: {
          productId,
          name: data.name,
          sku: data.sku,
          price: data.price,
          comparePrice: data.comparePrice,
          costPrice: data.costPrice,
          weight: data.weight,
          dimensions: data.dimensions,
          inventory: data.inventory || 0,
          isActive: true,
          attributes: data.attributes || {}
        }
      });

      logger.info(`Product variant added: ${variant.id} to product: ${productId}`);

      return variant;
    } catch (error) {
      logger.error('Error adding product variant:', error);
      throw error;
    }
  }

  /**
   * Update product variant
   */
  async updateProductVariant(variantId: string, data: Partial<ProductVariantData>): Promise<any> {
    try {
      const variant = await this.prisma.productVariant.update({
        where: { id: variantId },
        data: {
          name: data.name,
          sku: data.sku,
          price: data.price,
          comparePrice: data.comparePrice,
          costPrice: data.costPrice,
          weight: data.weight,
          dimensions: data.dimensions,
          inventory: data.inventory,
          attributes: data.attributes
        }
      });

      logger.info(`Product variant updated: ${variantId}`);

      return variant;
    } catch (error) {
      logger.error('Error updating product variant:', error);
      throw error;
    }
  }

  /**
   * Delete product variant
   */
  async deleteProductVariant(variantId: string): Promise<void> {
    try {
      await this.prisma.productVariant.update({
        where: { id: variantId },
        data: { isActive: false }
      });

      logger.info(`Product variant deleted: ${variantId}`);
    } catch (error) {
      logger.error('Error deleting product variant:', error);
      throw error;
    }
  }

  /**
   * Add product image
   */
  async addProductImage(productId: string, data: ProductImageData): Promise<any> {
    try {
      const image = await this.prisma.productImage.create({
        data: {
          productId,
          url: data.url,
          alt: data.alt,
          isPrimary: data.isPrimary || false,
          sortOrder: data.sortOrder || 0
        }
      });

      logger.info(`Product image added: ${image.id} to product: ${productId}`);

      return image;
    } catch (error) {
      logger.error('Error adding product image:', error);
      throw error;
    }
  }

  /**
   * Update product image
   */
  async updateProductImage(imageId: string, data: Partial<ProductImageData>): Promise<any> {
    try {
      const image = await this.prisma.productImage.update({
        where: { id: imageId },
        data: {
          url: data.url,
          alt: data.alt,
          isPrimary: data.isPrimary,
          sortOrder: data.sortOrder
        }
      });

      logger.info(`Product image updated: ${imageId}`);

      return image;
    } catch (error) {
      logger.error('Error updating product image:', error);
      throw error;
    }
  }

  /**
   * Delete product image
   */
  async deleteProductImage(imageId: string): Promise<void> {
    try {
      await this.prisma.productImage.delete({
        where: { id: imageId }
      });

      logger.info(`Product image deleted: ${imageId}`);
    } catch (error) {
      logger.error('Error deleting product image:', error);
      throw error;
    }
  }

  /**
   * Update product inventory
   */
  async updateProductInventory(productId: string, quantity: number, operation: 'add' | 'subtract' = 'subtract'): Promise<void> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: { variants: true }
      });

      if (!product) {
        throw new CustomError('Product not found', 404);
      }

      if (product.variants.length > 0) {
        // Update inventory for each variant
        for (const variant of product.variants) {
          const newInventory = operation === 'add' 
            ? variant.inventory + quantity 
            : Math.max(0, variant.inventory - quantity);

          await this.prisma.productVariant.update({
            where: { id: variant.id },
            data: { inventory: newInventory }
          });
        }
      } else {
        // Update main product inventory
        const newInventory = operation === 'add' 
          ? (product.inventory || 0) + quantity 
          : Math.max(0, (product.inventory || 0) - quantity);

        await this.prisma.product.update({
          where: { id: productId },
          data: { inventory: newInventory }
        });
      }

      logger.info(`Product inventory updated: ${productId}, operation: ${operation}, quantity: ${quantity}`);
    } catch (error) {
      logger.error('Error updating product inventory:', error);
      throw error;
    }
  }

  /**
   * Search products across all stores
   */
  async searchProducts(params: ProductSearchParams): Promise<ProductListResponse> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        categoryId, 
        minPrice, 
        maxPrice, 
        sortBy = 'createdAt', 
        sortOrder = 'desc',
        storeId,
        isFeatured,
        isDigital
      } = params;
      
      const skip = (page - 1) * limit;

      const where: Prisma.ProductWhereInput = {
        isActive: true,
        status: ProductStatus.PUBLISHED,
        store: {
          isActive: true,
          status: 'PUBLISHED'
        }
      };

      if (storeId) {
        where.storeId = storeId;
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } }
        ];
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      if (isFeatured !== undefined) {
        where.isFeatured = isFeatured;
      }

      if (isDigital !== undefined) {
        where.isDigital = isDigital;
      }

      const orderBy: Prisma.ProductOrderByWithRelationInput = {};
      orderBy[sortBy as keyof Product] = sortOrder;

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            category: true,
            store: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            variants: {
              where: { isActive: true },
              take: 1
            },
            images: {
              where: { isPrimary: true },
              take: 1
            },
            _count: {
              select: {
                orderItems: true,
                reviews: true
              }
            }
          }
        }),
        this.prisma.product.count({ where })
      ]);

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 10): Promise<ProductWithDetails[]> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          isActive: true,
          isFeatured: true,
          status: ProductStatus.PUBLISHED,
          store: {
            isActive: true,
            status: 'PUBLISHED'
          }
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          store: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          variants: {
            where: { isActive: true },
            take: 1
          },
          images: {
            where: { isPrimary: true },
            take: 1
          },
          _count: {
            select: {
              orderItems: true,
              reviews: true
            }
          }
        }
      });

      return products;
    } catch (error) {
      logger.error('Error getting featured products:', error);
      throw error;
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(storeId: string): Promise<ProductWithDetails[]> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          storeId,
          isActive: true,
          trackInventory: true,
          OR: [
            {
              inventory: {
                lte: { lowStockThreshold: true }
              }
            },
            {
              variants: {
                some: {
                  isActive: true,
                  inventory: {
                    lte: { lowStockThreshold: true }
                  }
                }
              }
            }
          ]
        },
        include: {
          category: true,
          variants: {
            where: { isActive: true }
          },
          images: {
            where: { isPrimary: true },
            take: 1
          }
        }
      });

      return products;
    } catch (error) {
      logger.error('Error getting low stock products:', error);
      throw error;
    }
  }
}

export const productService = new ProductService(); 