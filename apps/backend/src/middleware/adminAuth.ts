import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { UserRole } from '@prisma/client';

export const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ApiError(403, 'Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
}; 