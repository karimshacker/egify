import { body, param, query } from 'express-validator';

export const shippingValidation = {
  calculateShipping: [
    body('storeId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Store ID is required'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.productId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Product ID is required for each item'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1 for each item'),
    body('items.*.variantId')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Variant ID must be a valid string'),
    body('items.*.weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Weight must be a positive number'),
    body('destination')
      .isObject()
      .withMessage('Destination is required'),
    body('destination.country')
      .isString()
      .trim()
      .isLength({ min: 2, max: 3 })
      .withMessage('Country code must be 2-3 characters'),
    body('destination.state')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('State must be less than 100 characters'),
    body('destination.city')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('City must be less than 100 characters'),
    body('destination.postalCode')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Postal code must be less than 20 characters'),
  ],

  createShippingZone: [
    body('storeId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Store ID is required'),
    body('name')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Zone name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('countries')
      .isArray({ min: 1 })
      .withMessage('At least one country is required'),
    body('countries.*')
      .isString()
      .trim()
      .isLength({ min: 2, max: 3 })
      .withMessage('Country codes must be 2-3 characters'),
    body('states')
      .optional()
      .isArray()
      .withMessage('States must be an array'),
    body('states.*')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('State names must be less than 100 characters'),
    body('postalCodes')
      .optional()
      .isArray()
      .withMessage('Postal codes must be an array'),
    body('postalCodes.*')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Postal codes must be less than 20 characters'),
    body('rates')
      .isArray({ min: 1 })
      .withMessage('At least one shipping rate is required'),
    body('rates.*.name')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Rate name must be between 1 and 100 characters'),
    body('rates.*.price')
      .isFloat({ min: 0 })
      .withMessage('Rate price must be a positive number'),
    body('rates.*.minOrderValue')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum order value must be a positive number'),
    body('rates.*.maxOrderValue')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum order value must be a positive number'),
    body('rates.*.estimatedDays')
      .isInt({ min: 1 })
      .withMessage('Estimated days must be at least 1'),
    body('rates.*.isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],

  updateShippingZone: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Zone ID is required'),
    body('name')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Zone name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('countries')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one country is required'),
    body('countries.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 3 })
      .withMessage('Country codes must be 2-3 characters'),
    body('states')
      .optional()
      .isArray()
      .withMessage('States must be an array'),
    body('states.*')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('State names must be less than 100 characters'),
    body('postalCodes')
      .optional()
      .isArray()
      .withMessage('Postal codes must be an array'),
    body('postalCodes.*')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Postal codes must be less than 20 characters'),
    body('rates')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one shipping rate is required'),
    body('rates.*.name')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Rate name must be between 1 and 100 characters'),
    body('rates.*.price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Rate price must be a positive number'),
    body('rates.*.minOrderValue')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum order value must be a positive number'),
    body('rates.*.maxOrderValue')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum order value must be a positive number'),
    body('rates.*.estimatedDays')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Estimated days must be at least 1'),
    body('rates.*.isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],

  deleteShippingZone: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Zone ID is required'),
  ],

  trackShipment: [
    param('trackingNumber')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Tracking number is required'),
    query('carrier')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Carrier must be a valid string'),
  ],
}; 