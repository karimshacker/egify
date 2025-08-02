import { Router } from 'express';
import { uploadController } from '@/controllers/uploadController';
import { authenticate, authorizeStoreAccess } from '@/middleware/auth';

const router = Router();

// Protected routes
router.use(authenticate);

// General uploads
router.post('/image', uploadController.uploadImage);
router.post('/images', uploadController.uploadImages);
router.post('/presigned-url', uploadController.getPresignedUrl);
router.delete('/:filename', uploadController.deleteFile);

// Store-specific uploads
router.post('/store-logo', authorizeStoreAccess, uploadController.uploadStoreLogo);
router.post('/product-images', authorizeStoreAccess, uploadController.uploadProductImages);

export default router; 