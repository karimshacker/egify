import { body, param, query } from 'express-validator';
import { AddressType } from '@prisma/client';

export const userValidation = {
  updateProfile: [
    body('firstName')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    body('phone')
      .optional()
      .isString()
      .trim()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Phone number must be valid'),
  ],

  changePassword: [
    body('currentPassword')
      .isString()
      .trim()
      .isLength({ min: 6 })
      .withMessage('Current password must be at least 6 characters'),
    body('newPassword')
      .isString()
      .trim()
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must be at least 8 characters and contain uppercase, lowercase, number, and special character'),
  ],

  createAddress: [
    body('type')
      .isIn(Object.values(AddressType))
      .withMessage('Address type must be SHIPPING, BILLING, or BOTH'),
    body('firstName')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    body('company')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name must be less than 100 characters'),
    body('address1')
      .isString()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address line 1 must be between 5 and 200 characters'),
    body('address2')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address line 2 must be less than 200 characters'),
    body('city')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('City must be between 1 and 100 characters'),
    body('state')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('State must be less than 100 characters'),
    body('postalCode')
      .isString()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Postal code must be between 3 and 20 characters'),
    body('country')
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Country must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .isString()
      .trim()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Phone number must be valid'),
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault must be a boolean'),
  ],

  updateAddress: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Address ID is required'),
    body('type')
      .optional()
      .isIn(Object.values(AddressType))
      .withMessage('Address type must be SHIPPING, BILLING, or BOTH'),
    body('firstName')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    body('company')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name must be less than 100 characters'),
    body('address1')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address line 1 must be between 5 and 200 characters'),
    body('address2')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address line 2 must be less than 200 characters'),
    body('city')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('City must be between 1 and 100 characters'),
    body('state')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('State must be less than 100 characters'),
    body('postalCode')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Postal code must be between 3 and 20 characters'),
    body('country')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Country must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .isString()
      .trim()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Phone number must be valid'),
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault must be a boolean'),
  ],

  deleteAddress: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Address ID is required'),
  ],

  getNotifications: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('isRead')
      .optional()
      .isBoolean()
      .withMessage('isRead must be a boolean'),
  ],

  markNotificationAsRead: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Notification ID is required'),
  ],
}; 