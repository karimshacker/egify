import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, User, UserRole, Prisma } from '@prisma/client';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { CustomError } from '@/middleware/errorHandler';
import { 
  UserRegistrationData, 
  UserLoginData, 
  UserUpdateData, 
  PasswordResetData,
  TokenPayload,
  AuthResponse,
  UserProfile
} from '@/types';

export class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Register a new user
   */
  async registerUser(data: UserRegistrationData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email.toLowerCase() },
            { username: data.username.toLowerCase() }
          ]
        }
      });

      if (existingUser) {
        throw new CustomError(
          'User already exists with this email or username',
          409
        );
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          username: data.username.toLowerCase(),
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: data.role || UserRole.CUSTOMER,
          isActive: true,
          emailVerified: false,
          profile: {
            create: {
              avatar: data.avatar,
              bio: data.bio,
              dateOfBirth: data.dateOfBirth,
              address: data.address,
              preferences: data.preferences || {}
            }
          }
        },
        include: {
          profile: true,
          stores: {
            where: { isActive: true },
            select: { id: true, name: true, slug: true }
          }
        }
      });

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      // Save refresh token
      await this.saveRefreshToken(user.id, refreshToken);

      logger.info(`User registered successfully: ${user.email}`);

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
        expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN || '900')
      };
    } catch (error) {
      logger.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Authenticate user login
   */
  async loginUser(data: UserLoginData): Promise<AuthResponse> {
    try {
      // Find user by email or username
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: data.emailOrUsername.toLowerCase() },
            { username: data.emailOrUsername.toLowerCase() }
          ],
          isActive: true
        },
        include: {
          profile: true,
          stores: {
            where: { isActive: true },
            select: { id: true, name: true, slug: true }
          }
        }
      });

      if (!user) {
        throw new CustomError('Invalid credentials', 401);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      if (!isPasswordValid) {
        throw new CustomError('Invalid credentials', 401);
      }

      // Check if account is locked
      if (user.isLocked) {
        throw new CustomError('Account is locked. Please contact support.', 423);
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      // Save refresh token
      await this.saveRefreshToken(user.id, refreshToken);

      logger.info(`User logged in successfully: ${user.email}`);

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
        expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN || '900')
      };
    } catch (error) {
      logger.error('Error during login:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as TokenPayload;

      // Check if refresh token exists in database
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!storedToken || storedToken.isRevoked) {
        throw new CustomError('Invalid refresh token', 401);
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        await this.revokeRefreshToken(refreshToken);
        throw new CustomError('Refresh token expired', 401);
      }

      const user = storedToken.user;

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(user);

      // Revoke old refresh token and save new one
      await this.prisma.$transaction([
        this.prisma.refreshToken.update({
          where: { token: refreshToken },
          data: { isRevoked: true }
        }),
        this.prisma.refreshToken.create({
          data: {
            token: newRefreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800000'))
          }
        })
      ]);

      logger.info(`Token refreshed for user: ${user.email}`);

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN || '900')
      };
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logoutUser(userId: string, refreshToken?: string): Promise<void> {
    try {
      if (refreshToken) {
        // Revoke specific refresh token
        await this.revokeRefreshToken(refreshToken);
      } else {
        // Revoke all refresh tokens for user
        await this.prisma.refreshToken.updateMany({
          where: { userId, isRevoked: false },
          data: { isRevoked: true }
        });
      }

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Error during logout:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, data: UserUpdateData): Promise<UserProfile> {
    try {
      const updateData: Prisma.UserUpdateInput = {};
      const profileUpdateData: Prisma.UserProfileUpdateInput = {};

      // Update user fields
      if (data.firstName !== undefined) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.phone !== undefined) updateData.phone = data.phone;

      // Update profile fields
      if (data.avatar !== undefined) profileUpdateData.avatar = data.avatar;
      if (data.bio !== undefined) profileUpdateData.bio = data.bio;
      if (data.dateOfBirth !== undefined) profileUpdateData.dateOfBirth = data.dateOfBirth;
      if (data.address !== undefined) profileUpdateData.address = data.address;
      if (data.preferences !== undefined) profileUpdateData.preferences = data.preferences;

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          profile: {
            update: profileUpdateData
          }
        },
        include: {
          profile: true,
          stores: {
            where: { isActive: true },
            select: { id: true, name: true, slug: true }
          }
        }
      });

      logger.info(`User profile updated: ${userId}`);

      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new CustomError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new CustomError('Current password is incorrect', 400);
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { 
          password: hashedNewPassword,
          passwordChangedAt: new Date()
        }
      });

      // Revoke all refresh tokens to force re-login
      await this.prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true }
      });

      logger.info(`Password changed for user: ${userId}`);
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        // Don't reveal if user exists or not
        logger.info(`Password reset requested for non-existent email: ${email}`);
        return;
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // Save reset token
      await this.prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt: new Date(Date.now() + 3600000) // 1 hour
        }
      });

      // TODO: Send email with reset link
      // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

      logger.info(`Password reset requested for user: ${user.email}`);
    } catch (error) {
      logger.error('Error requesting password reset:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: PasswordResetData): Promise<void> {
    try {
      // Verify reset token
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET!) as any;
      
      if (decoded.type !== 'password_reset') {
        throw new CustomError('Invalid reset token', 400);
      }

      // Check if reset token exists and is valid
      const resetRecord = await this.prisma.passwordReset.findFirst({
        where: {
          token: data.token,
          expiresAt: { gt: new Date() },
          isUsed: false
        }
      });

      if (!resetRecord) {
        throw new CustomError('Invalid or expired reset token', 400);
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(data.newPassword, saltRounds);

      // Update password and mark token as used
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: resetRecord.userId },
          data: { 
            password: hashedPassword,
            passwordChangedAt: new Date()
          }
        }),
        this.prisma.passwordReset.update({
          where: { id: resetRecord.id },
          data: { isUsed: true }
        }),
        this.prisma.refreshToken.updateMany({
          where: { userId: resetRecord.userId, isRevoked: false },
          data: { isRevoked: true }
        })
      ]);

      logger.info(`Password reset completed for user: ${resetRecord.userId}`);
    } catch (error) {
      logger.error('Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      // Verify email verification token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      if (decoded.type !== 'email_verification') {
        throw new CustomError('Invalid verification token', 400);
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        throw new CustomError('User not found', 404);
      }

      if (user.emailVerified) {
        throw new CustomError('Email already verified', 400);
      }

      // Mark email as verified
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true }
      });

      logger.info(`Email verified for user: ${user.email}`);
    } catch (error) {
      logger.error('Error verifying email:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          stores: {
            where: { isActive: true },
            select: { id: true, name: true, slug: true }
          }
        }
      });

      return user ? this.sanitizeUser(user) : null;
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          profile: true,
          stores: {
            where: { isActive: true },
            select: { id: true, name: true, slug: true }
          }
        }
      });

      return user ? this.sanitizeUser(user) : null;
    } catch (error) {
      logger.error('Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: User & { profile: any; stores: any[] }): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      stores: user.stores.map(store => store.id)
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });

    return { accessToken, refreshToken };
  }

  /**
   * Save refresh token to database
   */
  private async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800000'))
      }
    });
  }

  /**
   * Revoke refresh token
   */
  private async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true }
    });
  }

  /**
   * Sanitize user data (remove sensitive information)
   */
  private sanitizeUser(user: User & { profile: any; stores: any[] }): UserProfile {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser as UserProfile;
  }
}

export const authService = new AuthService(); 