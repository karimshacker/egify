import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { createError } from './errorHandler';

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
      issuer: 'egify-platform',
      audience: 'egify-users',
    },
    async (payload, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
          include: {
            stores: {
              include: {
                store: true,
              },
            },
            roles: true,
          },
        });

        if (!user) {
          return done(null, false);
        }

        if (!user.isActive) {
          return done(null, false, { message: 'Account is deactivated' });
        }

        return done(null, user);
      } catch (error) {
        logger.error('JWT authentication error:', error);
        return done(error, false);
      }
    }
  )
);

// Local Strategy for login
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            stores: {
              include: {
                store: true,
              },
            },
            roles: true,
          },
        });

        if (!user) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        if (!user.isActive) {
          return done(null, false, { message: 'Account is deactivated' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        return done(null, user);
      } catch (error) {
        logger.error('Local authentication error:', error);
        return done(error, false);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        stores: {
          include: {
            store: true,
          },
        },
        roles: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      logger.error('Authentication error:', err);
      return next(createError('Authentication failed', 500));
    }

    if (!user) {
      return next(createError('Access denied. No token provided.', 401));
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Optional authentication middleware
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      logger.error('Optional authentication error:', err);
    }

    if (user) {
      req.user = user;
    }

    next();
  })(req, res, next);
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Access denied. No token provided.', 401));
    }

    const userRoles = req.user.roles?.map(role => role.name) || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return next(createError('Access denied. Insufficient permissions.', 403));
    }

    next();
  };
};

// Store access authorization middleware
export const authorizeStoreAccess = (storeIdParam: string = 'storeId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Access denied. No token provided.', 401));
    }

    const storeId = req.params[storeIdParam] || req.body.storeId;
    
    if (!storeId) {
      return next(createError('Store ID is required', 400));
    }

    const userStores = req.user.stores?.map(store => store.storeId) || [];
    const hasAccess = userStores.includes(storeId);

    if (!hasAccess) {
      return next(createError('Access denied. No access to this store.', 403));
    }

    next();
  };
};

// Generate JWT token
export const generateToken = (user: any): string => {
  const payload = {
    sub: user.id,
    email: user.email,
    roles: user.roles?.map((role: any) => role.name) || [],
    stores: user.stores?.map((store: any) => store.storeId) || [],
    iat: Math.floor(Date.now() / 1000),
    iss: 'egify-platform',
    aud: 'egify-users',
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

// Generate refresh token
export const generateRefreshToken = (user: any): string => {
  const payload = {
    sub: user.id,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    iss: 'egify-platform',
    aud: 'egify-users',
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

// Verify refresh token
export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
  } catch (error) {
    throw createError('Invalid refresh token', 401);
  }
}; 