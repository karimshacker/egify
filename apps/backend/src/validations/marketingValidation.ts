import { body, param, query } from 'express-validator';

export const marketingValidation = {
  createCampaign: [
    body('storeId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Store ID is required'),
    body('name')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Campaign name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('type')
      .isIn(['email', 'sms', 'push', 'social'])
      .withMessage('Campaign type must be email, sms, push, or social'),
    body('targetAudience')
      .isObject()
      .withMessage('Target audience is required'),
    body('budget')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Budget must be a positive number'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
    body('content')
      .isObject()
      .withMessage('Content is required'),
  ],

  updateCampaign: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Campaign ID is required'),
    body('name')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Campaign name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('targetAudience')
      .optional()
      .isObject()
      .withMessage('Target audience must be an object'),
    body('budget')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Budget must be a positive number'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
    body('content')
      .optional()
      .isObject()
      .withMessage('Content must be an object'),
  ],

  createEmailTemplate: [
    body('storeId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Store ID is required'),
    body('name')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Template name must be between 1 and 100 characters'),
    body('subject')
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Subject must be between 1 and 200 characters'),
    body('content')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Content is required'),
    body('variables')
      .optional()
      .isArray()
      .withMessage('Variables must be an array'),
    body('variables.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Variable names must be non-empty strings'),
  ],

  updateEmailTemplate: [
    param('id')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Template ID is required'),
    body('name')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Template name must be between 1 and 100 characters'),
    body('subject')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Subject must be between 1 and 200 characters'),
    body('content')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Content is required'),
    body('variables')
      .optional()
      .isArray()
      .withMessage('Variables must be an array'),
    body('variables.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Variable names must be non-empty strings'),
  ],

  addSubscriber: [
    body('storeId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Store ID is required'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
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
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Tag names must be between 1 and 50 characters'),
  ],
}; 