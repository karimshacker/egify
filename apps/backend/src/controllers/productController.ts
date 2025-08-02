import { Request, Response } from 'express';
import { productService } from '@/services/productService';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { 
  validateProductCreate, 
  validateProductUpdate,
  validateProductSearch,
  validatePagination
} from '@/middleware/validation';

export class ProductController {
  /**
   * Create a new product
   * POST /api/stores/:storeId/products
   */
  createProduct = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const productData = req.body;
    
    const product = await productService.createProduct(storeId, productData);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  });

  /**
   * Get all products for a store
   * GET /api/stores/:storeId/products
   */
  getStoreProducts = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category, 
      search, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minPrice,
      maxPrice,
      inStock
    } = req.query;
    
    const products = await productService.getProductsByStore(storeId, {
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      category: category as string,
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStock: inStock === 'true'
    });
    
    res.status(200).json({
      success: true,
      data: products
    });
  });

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  getProductById = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;
    
    const product = await productService.getProductById(productId);
    
    res.status(200).json({
      success: true,
      data: product
    });
  });

  /**
   * Get product by slug (public)
   * GET /api/products/slug/:slug
   */
  getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
    const slug = req.params.slug;
    const storeSlug = req.params.storeSlug;
    
    const product = await productService.getProductBySlug(slug, storeSlug);
    
    res.status(200).json({
      success: true,
      data: product
    });
  });

  /**
   * Update product
   * PUT /api/products/:id
   */
  updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;
    const storeId = req.params.storeId;
    const updateData = req.body;
    
    const product = await productService.updateProduct(productId, storeId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  });

  /**
   * Delete product (soft delete)
   * DELETE /api/products/:id
   */
  deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;
    const storeId = req.params.storeId;
    
    await productService.deleteProduct(productId, storeId);
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  });

  /**
   * Update product inventory
   * PATCH /api/products/:id/inventory
   */
  updateInventory = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;
    const storeId = req.params.storeId;
    const { quantity, variantId } = req.body;
    
    const inventory = await productService.updateInventory(productId, storeId, quantity, variantId);
    
    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      data: inventory
    });
  });

  /**
   * Get product variants
   * GET /api/products/:id/variants
   */
  getProductVariants = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;
    
    const variants = await productService.getProductVariants(productId);
    
    res.status(200).json({
      success: true,
      data: variants
    });
  });

  /**
   * Add product variant
   * POST /api/products/:id/variants
   */
  addProductVariant = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;
    const storeId = req.params.storeId;
    const variantData = req.body;
    
    const variant = await productService.addProductVariant(productId, storeId, variantData);
    
    res.status(201).json({
      success: true,
      message: 'Product variant added successfully',
      data: variant
    });
  });

  /**
   * Update product variant
   * PUT /api/products/:id/variants/:variantId
   */
  updateProductVariant = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;
    const variantId = req.params.variantId;
    const storeId = req.params.storeId;
    const updateData = req.body;
    
    const variant = await productService.updateProductVariant(productId, variantId, storeId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Product variant updated successfully',
      data: variant
    });
  });

  /**
   * Delete product variant
   * DELETE /api/products/:id/variants/:variantId
   */
  deleteProductVariant = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;
    const variantId = req.params.variantId;
    const storeId = req.params.storeId;
    
    await productService.deleteProductVariant(productId, variantId, storeId);
    
    res.status(200).json({
      success: true,
      message: 'Product variant deleted successfully'
    });
  });

  /**
   * Upload product images
   * POST /api/products/:id/images
   */
  uploadProductImages = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;
    const storeId = req.params.storeId;
    const images = req.body.images;
    
    const uploadedImages = await productService.uploadProductImages(productId, storeId, images);
    
    res.status(201).json({
      success: true,
      message: 'Product images uploaded successfully',
      data: uploadedImages
    });
  });

  /**
   * Delete product image
   * DELETE /api/products/:id/images/:imageId
   */
  deleteProductImage = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;
    const imageId = req.params.imageId;
    const storeId = req.params.storeId;
    
    await productService.deleteProductImage(productId, imageId, storeId);
    
    res.status(200).json({
      success: true,
      message: 'Product image deleted successfully'
    });
  });

  /**
   * Search products (public)
   * GET /api/products/search
   */
  searchProducts = asyncHandler(async (req: Request, res: Response) => {
    const { 
      q, 
      store, 
      category, 
      minPrice, 
      maxPrice, 
      inStock,
      page = 1, 
      limit = 10,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = req.query;
    
    const products = await productService.searchProducts({
      query: q as string,
      store: store as string,
      category: category as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStock: inStock === 'true',
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    });
    
    res.status(200).json({
      success: true,
      data: products
    });
  });

  /**
   * Get featured products
   * GET /api/products/featured
   */
  getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
    const { store, limit = 10 } = req.query;
    
    const products = await productService.getFeaturedProducts({
      store: store as string,
      limit: Number(limit)
    });
    
    res.status(200).json({
      success: true,
      data: products
    });
  });

  /**
   * Get low stock products
   * GET /api/stores/:storeId/products/low-stock
   */
  getLowStockProducts = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const { page = 1, limit = 10 } = req.query;
    
    const products = await productService.getLowStockProducts(storeId, {
      page: Number(page),
      limit: Number(limit)
    });
    
    res.status(200).json({
      success: true,
      data: products
    });
  });

  /**
   * Bulk update products
   * PATCH /api/stores/:storeId/products/bulk
   */
  bulkUpdateProducts = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    const { productIds, updates } = req.body;
    
    const result = await productService.bulkUpdateProducts(storeId, productIds, updates);
    
    res.status(200).json({
      success: true,
      message: 'Products updated successfully',
      data: result
    });
  });

  /**
   * Get product categories
   * GET /api/stores/:storeId/categories
   */
  getProductCategories = asyncHandler(async (req: Request, res: Response) => {
    const storeId = req.params.storeId;
    
    const categories = await productService.getProductCategories(storeId);
    
    res.status(200).json({
      success: true,
      data: categories
    });
  });
}

export const productController = new ProductController(); 