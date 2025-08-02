import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

export class UploadController {
  /**
   * Upload single image
   * POST /api/upload/image
   */
  uploadImage = asyncHandler(async (req: Request, res: Response) => {
    upload.single('image')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      try {
        // TODO: Implement S3 upload logic
        // const uploadedUrl = await uploadToS3(req.file, 'images');
        
        const uploadedUrl = `https://example.com/uploads/${Date.now()}-${req.file.originalname}`;
        
        res.status(200).json({
          success: true,
          message: 'Image uploaded successfully',
          data: {
            url: uploadedUrl,
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
          }
        });
      } catch (error) {
        logger.error('Error uploading image:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    });
  });

  /**
   * Upload multiple images
   * POST /api/upload/images
   */
  uploadImages = asyncHandler(async (req: Request, res: Response) => {
    upload.array('images', 10)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      try {
        const uploadedFiles = [];
        
        for (const file of req.files as Express.Multer.File[]) {
          // TODO: Implement S3 upload logic
          // const uploadedUrl = await uploadToS3(file, 'images');
          
          const uploadedUrl = `https://example.com/uploads/${Date.now()}-${file.originalname}`;
          
          uploadedFiles.push({
            url: uploadedUrl,
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype
          });
        }
        
        res.status(200).json({
          success: true,
          message: 'Images uploaded successfully',
          data: uploadedFiles
        });
      } catch (error) {
        logger.error('Error uploading images:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to upload images'
        });
      }
    });
  });

  /**
   * Upload store logo
   * POST /api/upload/store-logo
   */
  uploadStoreLogo = asyncHandler(async (req: Request, res: Response) => {
    upload.single('logo')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No logo uploaded'
        });
      }

      try {
        // TODO: Implement S3 upload logic with store-specific path
        // const uploadedUrl = await uploadToS3(req.file, 'store-logos');
        
        const uploadedUrl = `https://example.com/store-logos/${Date.now()}-${req.file.originalname}`;
        
        res.status(200).json({
          success: true,
          message: 'Store logo uploaded successfully',
          data: {
            url: uploadedUrl,
            filename: req.file.originalname,
            size: req.file.size
          }
        });
      } catch (error) {
        logger.error('Error uploading store logo:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to upload store logo'
        });
      }
    });
  });

  /**
   * Upload product images
   * POST /api/upload/product-images
   */
  uploadProductImages = asyncHandler(async (req: Request, res: Response) => {
    upload.array('images', 10)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No images uploaded'
        });
      }

      try {
        const uploadedImages = [];
        
        for (const file of req.files as Express.Multer.File[]) {
          // TODO: Implement S3 upload logic with product-specific path
          // const uploadedUrl = await uploadToS3(file, 'product-images');
          
          const uploadedUrl = `https://example.com/product-images/${Date.now()}-${file.originalname}`;
          
          uploadedImages.push({
            url: uploadedUrl,
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype
          });
        }
        
        res.status(200).json({
          success: true,
          message: 'Product images uploaded successfully',
          data: uploadedImages
        });
      } catch (error) {
        logger.error('Error uploading product images:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to upload product images'
        });
      }
    });
  });

  /**
   * Delete uploaded file
   * DELETE /api/upload/:filename
   */
  deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const { filename } = req.params;
    
    try {
      // TODO: Implement S3 delete logic
      // await deleteFromS3(filename);
      
      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete file'
      });
    }
  });

  /**
   * Get upload presigned URL for direct upload
   * POST /api/upload/presigned-url
   */
  getPresignedUrl = asyncHandler(async (req: Request, res: Response) => {
    const { filename, contentType, folder } = req.body;
    
    try {
      // TODO: Implement S3 presigned URL generation
      // const presignedUrl = await generatePresignedUrl(filename, contentType, folder);
      
      const presignedUrl = `https://example.com/presigned/${folder}/${filename}`;
      
      res.status(200).json({
        success: true,
        data: {
          url: presignedUrl,
          fields: {
            key: `${folder}/${filename}`,
            'Content-Type': contentType
          }
        }
      });
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate presigned URL'
      });
    }
  });
}

export const uploadController = new UploadController(); 