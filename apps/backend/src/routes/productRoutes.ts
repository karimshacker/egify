import { Router } from 'express';
import { productController } from '@/controllers/productController';
import { authenticate, authorizeStoreAccess } from '@/middleware/auth';
import { 
  validateProductCreate, 
  validateProductUpdate,
  validateProductSearch,
  validatePagination
} from '@/middleware/validation';

const router = Router();

// Public routes
router.get('/search', productController.searchProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id', productController.getProductById);

// Protected routes
router.use(authenticate);

// Product management (store-specific)
router.post('/stores/:storeId/products', authorizeStoreAccess, validateProductCreate, productController.createProduct);
router.get('/stores/:storeId/products', authorizeStoreAccess, validatePagination, productController.getStoreProducts);
router.get('/stores/:storeId/products/low-stock', authorizeStoreAccess, productController.getLowStockProducts);
router.patch('/stores/:storeId/products/bulk', authorizeStoreAccess, productController.bulkUpdateProducts);
router.get('/stores/:storeId/categories', authorizeStoreAccess, productController.getProductCategories);

// Product operations
router.put('/:id', authorizeStoreAccess, validateProductUpdate, productController.updateProduct);
router.delete('/:id', authorizeStoreAccess, productController.deleteProduct);
router.patch('/:id/inventory', authorizeStoreAccess, productController.updateInventory);

// Product variants
router.get('/:id/variants', productController.getProductVariants);
router.post('/:id/variants', authorizeStoreAccess, productController.addProductVariant);
router.put('/:id/variants/:variantId', authorizeStoreAccess, productController.updateProductVariant);
router.delete('/:id/variants/:variantId', authorizeStoreAccess, productController.deleteProductVariant);

// Product images
router.post('/:id/images', authorizeStoreAccess, productController.uploadProductImages);
router.delete('/:id/images/:imageId', authorizeStoreAccess, productController.deleteProductImage);

export default router; 