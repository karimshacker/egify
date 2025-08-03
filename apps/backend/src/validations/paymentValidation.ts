import { body, param, query } from 'express-validator';

export const paymentValidation = {
  createPaymentIntent: [
    body('amount')
      .isInt({ min: 1 })
      .withMessage('Amount must be a positive integer (in cents)'),
    body('currency')
      .isIn(['usd', 'eur', 'gbp', 'cad', 'aud', 'jpy'])
      .withMessage('Please provide a valid currency'),
    body('orderId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Order ID is required'),
    body('paymentMethodId')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Payment method ID must be a valid string'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],

  confirmPayment: [
    body('paymentIntentId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Payment intent ID is required'),
    body('paymentMethodId')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Payment method ID must be a valid string'),
  ],

  createRefund: [
    param('paymentId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Payment ID is required'),
    body('amount')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Refund amount must be a positive integer (in cents)'),
    body('reason')
      .optional()
      .isIn(['duplicate', 'fraudulent', 'requested_by_customer', 'expired_uncaptured'])
      .withMessage('Refund reason must be duplicate, fraudulent, requested_by_customer, or expired_uncaptured'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],

  createPaymentMethod: [
    body('type')
      .isIn(['card', 'bank_account', 'sepa_debit'])
      .withMessage('Payment method type must be card, bank_account, or sepa_debit'),
    body('card')
      .optional()
      .isObject()
      .withMessage('Card details must be an object'),
    body('card.number')
      .optional()
      .matches(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/)
      .withMessage('Card number must be in format: 1234 5678 9012 3456'),
    body('card.exp_month')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('Expiration month must be between 1 and 12'),
    body('card.exp_year')
      .optional()
      .isInt({ min: new Date().getFullYear() })
      .withMessage('Expiration year must be current year or later'),
    body('card.cvc')
      .optional()
      .matches(/^\d{3,4}$/)
      .withMessage('CVC must be 3 or 4 digits'),
    body('billing_details')
      .optional()
      .isObject()
      .withMessage('Billing details must be an object'),
    body('billing_details.name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('billing_details.email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('billing_details.phone')
      .optional()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Phone number must be valid'),
    body('billing_details.address')
      .optional()
      .isObject()
      .withMessage('Address must be an object'),
    body('billing_details.address.line1')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address line 1 must be between 5 and 200 characters'),
    body('billing_details.address.line2')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address line 2 must not exceed 200 characters'),
    body('billing_details.address.city')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    body('billing_details.address.state')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('State must not exceed 100 characters'),
    body('billing_details.address.postal_code')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Postal code must be between 3 and 20 characters'),
    body('billing_details.address.country')
      .optional()
      .trim()
      .isLength({ min: 2, max: 2 })
      .withMessage('Country must be a 2-letter ISO country code'),
  ],

  attachPaymentMethod: [
    param('paymentMethodId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Payment method ID is required'),
    body('customerId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Customer ID is required'),
  ],

  detachPaymentMethod: [
    param('paymentMethodId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Payment method ID is required'),
  ],

  getPaymentMethods: [
    query('customerId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Customer ID is required'),
    query('type')
      .optional()
      .isIn(['card', 'bank_account', 'sepa_debit'])
      .withMessage('Payment method type must be card, bank_account, or sepa_debit'),
  ],

  getPayments: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('orderId')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Order ID must be a valid string'),
    query('customerId')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Customer ID must be a valid string'),
    query('status')
      .optional()
      .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'])
      .withMessage('Status must be PENDING, PAID, FAILED, REFUNDED, or PARTIALLY_REFUNDED'),
    query('method')
      .optional()
      .isIn(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CASH', 'OTHER'])
      .withMessage('Method must be CREDIT_CARD, DEBIT_CARD, PAYPAL, BANK_TRANSFER, CASH, or OTHER'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('minAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum amount must be a positive number'),
    query('maxAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum amount must be a positive number'),
    query('sortBy')
      .optional()
      .isIn(['amount', 'createdAt', 'updatedAt'])
      .withMessage('Sort by must be amount, createdAt, or updatedAt'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
  ],

  getPayment: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Payment ID is required'),
  ],

  updatePayment: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Payment ID is required'),
    body('status')
      .optional()
      .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'])
      .withMessage('Status must be PENDING, PAID, FAILED, REFUNDED, or PARTIALLY_REFUNDED'),
    body('transactionId')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Transaction ID must be a valid string'),
    body('gateway')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Gateway must be a valid string'),
    body('gatewayData')
      .optional()
      .isObject()
      .withMessage('Gateway data must be an object'),
  ],

  processWebhook: [
    body('type')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Webhook type is required'),
    body('data')
      .isObject()
      .withMessage('Webhook data is required'),
    body('data.object')
      .isObject()
      .withMessage('Webhook object is required'),
  ],
}; 