import { body, param } from 'express-validator';
import { UserRole, StoreStatus } from '@prisma/client';

export const adminValidation = {
  updateUser: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('User ID is required'),
    body('role')
      .optional()
      .isIn(Object.values(UserRole))
      .withMessage('Invalid user role'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('emailVerified')
      .optional()
      .isBoolean()
      .withMessage('emailVerified must be a boolean'),
  ],

  updateStore: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Store ID is required'),
    body('status')
      .optional()
      .isIn(Object.values(StoreStatus))
      .withMessage('Invalid store status'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],

  updateSettings: [
    body('platformName')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Platform name must be between 1 and 100 characters'),
    body('platformDescription')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Platform description must be less than 500 characters'),
    body('maintenanceMode')
      .optional()
      .isBoolean()
      .withMessage('maintenanceMode must be a boolean'),
    body('registrationEnabled')
      .optional()
      .isBoolean()
      .withMessage('registrationEnabled must be a boolean'),
    body('emailVerificationRequired')
      .optional()
      .isBoolean()
      .withMessage('emailVerificationRequired must be a boolean'),
    body('maxStoresPerUser')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('maxStoresPerUser must be between 1 and 100'),
    body('maxProductsPerStore')
      .optional()
      .isInt({ min: 1, max: 10000 })
      .withMessage('maxProductsPerStore must be between 1 and 10000'),
  ],
}; 