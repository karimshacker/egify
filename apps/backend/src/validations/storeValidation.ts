import { body, param, query } from 'express-validator';

export const storeValidation = {
  createStore: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Store name must be between 2 and 100 characters'),
    body('slug')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug must be 2-50 characters and contain only lowercase letters, numbers, and hyphens'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('logo')
      .optional()
      .isURL()
      .withMessage('Logo must be a valid URL'),
    body('banner')
      .optional()
      .isURL()
      .withMessage('Banner must be a valid URL'),
  ],

  updateStore: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Store ID is required'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Store name must be between 2 and 100 characters'),
    body('slug')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug must be 2-50 characters and contain only lowercase letters, numbers, and hyphens'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('logo')
      .optional()
      .isURL()
      .withMessage('Logo must be a valid URL'),
    body('banner')
      .optional()
      .isURL()
      .withMessage('Banner must be a valid URL'),
    body('status')
      .optional()
      .isIn(['DRAFT', 'ACTIVE', 'SUSPENDED', 'CLOSED'])
      .withMessage('Status must be DRAFT, ACTIVE, SUSPENDED, or CLOSED'),
  ],

  updateStoreSettings: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Store ID is required'),
    body('currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'])
      .withMessage('Please provide a valid currency'),
    body('language')
      .optional()
      .isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'])
      .withMessage('Please provide a valid language code'),
    body('timezone')
      .optional()
      .isIn(['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'])
      .withMessage('Please provide a valid timezone'),
    body('taxRate')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Tax rate must be between 0 and 100'),
    body('shippingEnabled')
      .optional()
      .isBoolean()
      .withMessage('shippingEnabled must be a boolean'),
    body('pickupEnabled')
      .optional()
      .isBoolean()
      .withMessage('pickupEnabled must be a boolean'),
    body('deliveryEnabled')
      .optional()
      .isBoolean()
      .withMessage('deliveryEnabled must be a boolean'),
    body('autoAcceptOrders')
      .optional()
      .isBoolean()
      .withMessage('autoAcceptOrders must be a boolean'),
    body('requireCustomerApproval')
      .optional()
      .isBoolean()
      .withMessage('requireCustomerApproval must be a boolean'),
  ],

  getStores: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['DRAFT', 'ACTIVE', 'SUSPENDED', 'CLOSED'])
      .withMessage('Status must be DRAFT, ACTIVE, SUSPENDED, or CLOSED'),
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Search term must not be empty'),
  ],

  deleteStore: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Store ID is required'),
  ],
}; 