import { body, param, query } from 'express-validator';

export const orderValidation = {
  createOrder: [
    body('storeId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Store ID is required'),
    body('customerId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Customer ID is required'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('Order must contain at least one item'),
    body('items.*.productId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Product ID is required for each item'),
    body('items.*.variantId')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Variant ID must be a valid string'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1 for each item'),
    body('shippingAddress')
      .isObject()
      .withMessage('Shipping address is required'),
    body('shippingAddress.firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('shippingAddress.lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('shippingAddress.company')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name must not exceed 100 characters'),
    body('shippingAddress.address1')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address must be between 5 and 200 characters'),
    body('shippingAddress.address2')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address line 2 must not exceed 200 characters'),
    body('shippingAddress.city')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    body('shippingAddress.state')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('State must not exceed 100 characters'),
    body('shippingAddress.postalCode')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Postal code must be between 3 and 20 characters'),
    body('shippingAddress.country')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Country must be between 2 and 100 characters'),
    body('shippingAddress.phone')
      .optional()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Phone number must be valid'),
    body('billingAddress')
      .optional()
      .isObject()
      .withMessage('Billing address must be an object'),
    body('billingAddress.firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('billingAddress.lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('billingAddress.company')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name must not exceed 100 characters'),
    body('billingAddress.address1')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address must be between 5 and 200 characters'),
    body('billingAddress.address2')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address line 2 must not exceed 200 characters'),
    body('billingAddress.city')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    body('billingAddress.state')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('State must not exceed 100 characters'),
    body('billingAddress.postalCode')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Postal code must be between 3 and 20 characters'),
    body('billingAddress.country')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Country must be between 2 and 100 characters'),
    body('billingAddress.phone')
      .optional()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Phone number must be valid'),
    body('shippingMethod')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Shipping method must be a valid string'),
    body('paymentMethod')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Payment method must be a valid string'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters'),
    body('customerNotes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Customer notes must not exceed 1000 characters'),
  ],

  updateOrder: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Order ID is required'),
    body('status')
      .optional()
      .isIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
      .withMessage('Status must be PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, or REFUNDED'),
    body('paymentStatus')
      .optional()
      .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'])
      .withMessage('Payment status must be PENDING, PAID, FAILED, REFUNDED, or PARTIALLY_REFUNDED'),
    body('shippingMethod')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Shipping method must be a valid string'),
    body('paymentMethod')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Payment method must be a valid string'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters'),
    body('customerNotes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Customer notes must not exceed 1000 characters'),
  ],

  addOrderNote: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Order ID is required'),
    body('note')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Note must be between 1 and 1000 characters'),
    body('isInternal')
      .optional()
      .isBoolean()
      .withMessage('isInternal must be a boolean'),
  ],

  getOrders: [
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
    query('customerId')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Customer ID must be a valid string'),
    query('status')
      .optional()
      .isIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
      .withMessage('Status must be PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, or REFUNDED'),
    query('paymentStatus')
      .optional()
      .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'])
      .withMessage('Payment status must be PENDING, PAID, FAILED, REFUNDED, or PARTIALLY_REFUNDED'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('minTotal')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum total must be a positive number'),
    query('maxTotal')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum total must be a positive number'),
    query('sortBy')
      .optional()
      .isIn(['orderNumber', 'total', 'createdAt', 'updatedAt'])
      .withMessage('Sort by must be orderNumber, total, createdAt, or updatedAt'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
  ],

  getOrder: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Order ID is required'),
  ],

  cancelOrder: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Order ID is required'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Cancellation reason must not exceed 500 characters'),
  ],

  refundOrder: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Order ID is required'),
    body('amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Refund amount must be a positive number'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Refund reason must not exceed 500 characters'),
  ],
}; 