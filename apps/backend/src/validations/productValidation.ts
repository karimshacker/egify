import { body, param, query } from 'express-validator';

export const productValidation = {
  createProduct: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Product name must be between 2 and 200 characters'),
    body('slug')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug must be 2-100 characters and contain only lowercase letters, numbers, and hyphens'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must not exceed 2000 characters'),
    body('sku')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('SKU must not exceed 100 characters'),
    body('barcode')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Barcode must not exceed 100 characters'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('comparePrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Compare price must be a positive number'),
    body('costPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost price must be a positive number'),
    body('weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Weight must be a positive number'),
    body('dimensions')
      .optional()
      .isObject()
      .withMessage('Dimensions must be an object'),
    body('categoryId')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Category ID must be a valid string'),
    body('storeId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Store ID is required'),
    body('status')
      .optional()
      .isIn(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'])
      .withMessage('Status must be DRAFT, ACTIVE, INACTIVE, or ARCHIVED'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be a boolean'),
    body('isDigital')
      .optional()
      .isBoolean()
      .withMessage('isDigital must be a boolean'),
    body('requiresShipping')
      .optional()
      .isBoolean()
      .withMessage('requiresShipping must be a boolean'),
    body('trackInventory')
      .optional()
      .isBoolean()
      .withMessage('trackInventory must be a boolean'),
    body('lowStockThreshold')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Low stock threshold must be a non-negative integer'),
    body('seoTitle')
      .optional()
      .trim()
      .isLength({ max: 60 })
      .withMessage('SEO title must not exceed 60 characters'),
    body('seoDescription')
      .optional()
      .trim()
      .isLength({ max: 160 })
      .withMessage('SEO description must not exceed 160 characters'),
    body('seoKeywords')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('SEO keywords must not exceed 200 characters'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be between 1 and 50 characters'),
  ],

  updateProduct: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Product ID is required'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Product name must be between 2 and 200 characters'),
    body('slug')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug must be 2-100 characters and contain only lowercase letters, numbers, and hyphens'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must not exceed 2000 characters'),
    body('sku')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('SKU must not exceed 100 characters'),
    body('barcode')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Barcode must not exceed 100 characters'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('comparePrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Compare price must be a positive number'),
    body('costPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost price must be a positive number'),
    body('weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Weight must be a positive number'),
    body('dimensions')
      .optional()
      .isObject()
      .withMessage('Dimensions must be an object'),
    body('categoryId')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Category ID must be a valid string'),
    body('status')
      .optional()
      .isIn(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'])
      .withMessage('Status must be DRAFT, ACTIVE, INACTIVE, or ARCHIVED'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be a boolean'),
    body('isDigital')
      .optional()
      .isBoolean()
      .withMessage('isDigital must be a boolean'),
    body('requiresShipping')
      .optional()
      .isBoolean()
      .withMessage('requiresShipping must be a boolean'),
    body('trackInventory')
      .optional()
      .isBoolean()
      .withMessage('trackInventory must be a boolean'),
    body('lowStockThreshold')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Low stock threshold must be a non-negative integer'),
    body('seoTitle')
      .optional()
      .trim()
      .isLength({ max: 60 })
      .withMessage('SEO title must not exceed 60 characters'),
    body('seoDescription')
      .optional()
      .trim()
      .isLength({ max: 160 })
      .withMessage('SEO description must not exceed 160 characters'),
    body('seoKeywords')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('SEO keywords must not exceed 200 characters'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be between 1 and 50 characters'),
  ],

  createProductVariant: [
    param('productId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Product ID is required'),
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Variant name must be between 1 and 100 characters'),
    body('sku')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('SKU must not exceed 100 characters'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('comparePrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Compare price must be a positive number'),
    body('costPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost price must be a positive number'),
    body('weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Weight must be a positive number'),
    body('dimensions')
      .optional()
      .isObject()
      .withMessage('Dimensions must be an object'),
    body('inventory')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Inventory must be a non-negative integer'),
    body('attributes')
      .optional()
      .isObject()
      .withMessage('Attributes must be an object'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],

  updateProductVariant: [
    param('productId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Product ID is required'),
    param('variantId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Variant ID is required'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Variant name must be between 1 and 100 characters'),
    body('sku')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('SKU must not exceed 100 characters'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('comparePrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Compare price must be a positive number'),
    body('costPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost price must be a positive number'),
    body('weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Weight must be a positive number'),
    body('dimensions')
      .optional()
      .isObject()
      .withMessage('Dimensions must be an object'),
    body('inventory')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Inventory must be a non-negative integer'),
    body('attributes')
      .optional()
      .isObject()
      .withMessage('Attributes must be an object'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],

  getProducts: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('storeId')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Store ID must be a valid string'),
    query('categoryId')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Category ID must be a valid string'),
    query('status')
      .optional()
      .isIn(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'])
      .withMessage('Status must be DRAFT, ACTIVE, INACTIVE, or ARCHIVED'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    query('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be a boolean'),
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Search term must not be empty'),
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be a positive number'),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a positive number'),
    query('sortBy')
      .optional()
      .isIn(['name', 'price', 'createdAt', 'updatedAt'])
      .withMessage('Sort by must be name, price, createdAt, or updatedAt'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
  ],

  deleteProduct: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Product ID is required'),
  ],

  deleteProductVariant: [
    param('productId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Product ID is required'),
    param('variantId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Variant ID is required'),
  ],
}; 