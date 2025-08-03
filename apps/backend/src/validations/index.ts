import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from '@/utils/ApiError';

// Import all validation schemas
export { authValidation } from './authValidation';
export { storeValidation } from './storeValidation';
export { productValidation } from './productValidation';
export { orderValidation } from './orderValidation';
export { customerValidation } from './customerValidation';
export { paymentValidation } from './paymentValidation';
export { userValidation } from './userValidation';
export { shippingValidation } from './shippingValidation';
export { marketingValidation } from './marketingValidation';

/**
 * Validation result handler
 * Checks for validation errors and throws an ApiError if any are found
 */
export const validateRequest = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      }));

      return next(new ApiError(400, 'Validation failed', errorMessages));
    }

    next();
  };
};

/**
 * Generic validation helpers
 */
export const commonValidations = {
  // UUID parameter validation
  validateUUID: (paramName: string) => [
    (req: Request, res: Response, next: NextFunction) => {
      const value = req.params[paramName];
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return next(new ApiError(400, `${paramName} is required`));
      }
      next();
    }
  ],

  // Pagination validation
  validatePagination: [
    (req: Request, res: Response, next: NextFunction) => {
      const { page, limit } = req.query;
      
      if (page && (isNaN(Number(page)) || Number(page) < 1)) {
        return next(new ApiError(400, 'Page must be a positive integer'));
      }
      
      if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
        return next(new ApiError(400, 'Limit must be between 1 and 100'));
      }
      
      next();
    }
  ],

  // Date range validation
  validateDateRange: [
    (req: Request, res: Response, next: NextFunction) => {
      const { startDate, endDate } = req.query;
      
      if (startDate && !isValidDate(startDate as string)) {
        return next(new ApiError(400, 'Start date must be a valid date'));
      }
      
      if (endDate && !isValidDate(endDate as string)) {
        return next(new ApiError(400, 'End date must be a valid date'));
      }
      
      if (startDate && endDate && new Date(startDate as string) > new Date(endDate as string)) {
        return next(new ApiError(400, 'Start date must be before end date'));
      }
      
      next();
    }
  ],

  // Search validation
  validateSearch: [
    (req: Request, res: Response, next: NextFunction) => {
      const { search } = req.query;
      
      if (search && (typeof search !== 'string' || search.trim().length === 0)) {
        return next(new ApiError(400, 'Search term must not be empty'));
      }
      
      next();
    }
  ],

  // Sort validation
  validateSort: (allowedFields: string[]) => [
    (req: Request, res: Response, next: NextFunction) => {
      const { sortBy, sortOrder } = req.query;
      
      if (sortBy && !allowedFields.includes(sortBy as string)) {
        return next(new ApiError(400, `Sort by must be one of: ${allowedFields.join(', ')}`));
      }
      
      if (sortOrder && !['asc', 'desc'].includes(sortOrder as string)) {
        return next(new ApiError(400, 'Sort order must be asc or desc'));
      }
      
      next();
    }
  ],
};

/**
 * Helper function to validate date strings
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Export validation middleware for use in routes
 */
export const validationMiddleware = {
  validateRequest,
  commonValidations,
}; 