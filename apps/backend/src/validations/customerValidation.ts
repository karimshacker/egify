import { body, param, query } from 'express-validator';

export const customerValidation = {
  createCustomer: [
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('phone')
      .optional()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Phone number must be valid'),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Date of birth must be a valid ISO 8601 date'),
    body('gender')
      .optional()
      .isIn(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
      .withMessage('Gender must be MALE, FEMALE, OTHER, or PREFER_NOT_TO_SAY'),
    body('storeId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Store ID is required'),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object'),
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

  updateCustomer: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Customer ID is required'),
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('phone')
      .optional()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Phone number must be valid'),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Date of birth must be a valid ISO 8601 date'),
    body('gender')
      .optional()
      .isIn(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
      .withMessage('Gender must be MALE, FEMALE, OTHER, or PREFER_NOT_TO_SAY'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('isVerified')
      .optional()
      .isBoolean()
      .withMessage('isVerified must be a boolean'),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object'),
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

  createCustomerAddress: [
    param('customerId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Customer ID is required'),
    body('type')
      .isIn(['SHIPPING', 'BILLING', 'BOTH'])
      .withMessage('Address type must be SHIPPING, BILLING, or BOTH'),
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('company')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name must not exceed 100 characters'),
    body('address1')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address must be between 5 and 200 characters'),
    body('address2')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address line 2 must not exceed 200 characters'),
    body('city')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    body('state')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('State must not exceed 100 characters'),
    body('postalCode')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Postal code must be between 3 and 20 characters'),
    body('country')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Country must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Phone number must be valid'),
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault must be a boolean'),
  ],

  updateCustomerAddress: [
    param('customerId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Customer ID is required'),
    param('addressId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Address ID is required'),
    body('type')
      .optional()
      .isIn(['SHIPPING', 'BILLING', 'BOTH'])
      .withMessage('Address type must be SHIPPING, BILLING, or BOTH'),
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('company')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name must not exceed 100 characters'),
    body('address1')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address must be between 5 and 200 characters'),
    body('address2')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address line 2 must not exceed 200 characters'),
    body('city')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    body('state')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('State must not exceed 100 characters'),
    body('postalCode')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Postal code must be between 3 and 20 characters'),
    body('country')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Country must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Phone number must be valid'),
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault must be a boolean'),
  ],

  getCustomers: [
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
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    query('isVerified')
      .optional()
      .isBoolean()
      .withMessage('isVerified must be a boolean'),
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Search term must not be empty'),
    query('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    query('tags.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Each tag must not be empty'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('sortBy')
      .optional()
      .isIn(['firstName', 'lastName', 'email', 'createdAt', 'updatedAt'])
      .withMessage('Sort by must be firstName, lastName, email, createdAt, or updatedAt'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
  ],

  getCustomer: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Customer ID is required'),
  ],

  deleteCustomer: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Customer ID is required'),
  ],

  deleteCustomerAddress: [
    param('customerId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Customer ID is required'),
    param('addressId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Address ID is required'),
  ],

  addCustomerTag: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Customer ID is required'),
    body('tag')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Tag must be between 1 and 50 characters'),
  ],

  removeCustomerTag: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Customer ID is required'),
    param('tag')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Tag must be between 1 and 50 characters'),
  ],
}; 