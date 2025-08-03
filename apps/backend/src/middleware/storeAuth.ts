import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { UserRole } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const storeAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const storeId = req.query.storeId || req.body.storeId || req.params.storeId;

    if (!user) {
      throw new ApiError(401, 'Authentication required');
    }

    // Admins can access all stores
    if (user.role === UserRole.ADMIN) {
      return next();
    }

    if (!storeId) {
      throw new ApiError(400, 'Store ID is required');
    }

    // Check if user owns the store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId as string,
        ownerId: user.id,
      },
    });

    if (!store) {
      throw new ApiError(403, 'Access denied to store');
    }

    next();
  } catch (error) {
    next(error);
  }
}; 