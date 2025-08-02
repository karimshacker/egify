import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AuthService } from '@/services/authService';
import { prisma } from '@/utils/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@/utils/database');
jest.mock('@/utils/logger');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('registerUser', () => {
    const mockUserData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      role: 'CUSTOMER' as const,
      avatar: 'https://example.com/avatar.jpg',
      bio: 'Test bio',
      dateOfBirth: new Date('1990-01-01'),
      address: {
        address1: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'US'
      },
      preferences: { theme: 'dark' }
    };

    it('should register a new user successfully', async () => {
      // Mock bcrypt hash
      mockBcrypt.hash.mockResolvedValue('hashedPassword' as never);

      // Mock JWT sign
      mockJwt.sign.mockReturnValue('mockToken' as never);

      // Mock Prisma operations
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: false,
        emailVerifiedAt: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        profile: {
          id: 'profile123',
          userId: 'user123',
          avatar: 'https://example.com/avatar.jpg',
          bio: 'Test bio',
          dateOfBirth: new Date('1990-01-01'),
          address: mockUserData.address,
          preferences: { theme: 'dark' },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        stores: []
      } as any);

      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token123',
        token: 'refreshToken',
        userId: 'user123',
        expiresAt: new Date(),
        createdAt: new Date()
      } as any);

      const result = await authService.registerUser(mockUserData);

      expect(result).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mockToken');
      expect(result.refreshToken).toBe('refreshToken');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockJwt.sign).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'existing123',
        email: 'test@example.com',
        username: 'testuser'
      } as any);

      await expect(authService.registerUser(mockUserData)).rejects.toThrow(
        'User already exists with this email or username'
      );
    });
  });

  describe('loginUser', () => {
    const mockLoginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should login user successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: true,
        profile: {
          avatar: 'https://example.com/avatar.jpg',
          bio: 'Test bio'
        },
        stores: []
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue('mockToken' as never);

      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token123',
        token: 'refreshToken',
        userId: 'user123',
        expiresAt: new Date(),
        createdAt: new Date()
      } as any);

      const result = await authService.loginUser(mockLoginData);

      expect(result).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mockToken');
      expect(result.refreshToken).toBe('refreshToken');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    });

    it('should throw error for invalid credentials', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(authService.loginUser(mockLoginData)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error for inactive user', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword',
        isActive: false
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);

      await expect(authService.loginUser(mockLoginData)).rejects.toThrow(
        'Account is deactivated'
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockRefreshToken = {
        id: 'token123',
        token: 'validRefreshToken',
        userId: 'user123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Future date
        createdAt: new Date()
      };

      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: true,
        profile: { avatar: null, bio: null },
        stores: []
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockRefreshToken as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockJwt.sign.mockReturnValue('newAccessToken' as never);

      const result = await authService.refreshToken('validRefreshToken');

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('newAccessToken');
      expect(result.user.id).toBe('user123');
    });

    it('should throw error for invalid refresh token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(authService.refreshToken('invalidToken')).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should throw error for expired refresh token', async () => {
      const mockRefreshToken = {
        id: 'token123',
        token: 'expiredRefreshToken',
        userId: 'user123',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Past date
        createdAt: new Date()
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockRefreshToken as any);

      await expect(authService.refreshToken('expiredToken')).rejects.toThrow(
        'Refresh token has expired'
      );
    });
  });

  describe('logoutUser', () => {
    it('should logout user successfully', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 } as any);

      await expect(authService.logoutUser('user123')).resolves.not.toThrow();
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user123' }
      });
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: true,
        profile: {
          avatar: 'https://example.com/avatar.jpg',
          bio: 'Test bio'
        },
        stores: []
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await authService.getUserProfile('user123');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('testuser');
    });

    it('should throw error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.getUserProfile('nonexistent')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('updateUserProfile', () => {
    const mockUpdateData = {
      firstName: 'Updated',
      lastName: 'Name',
      phone: '+1987654321',
      avatar: 'https://example.com/new-avatar.jpg',
      bio: 'Updated bio'
    };

    it('should update user profile successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: true,
        profile: {
          avatar: 'https://example.com/avatar.jpg',
          bio: 'Test bio'
        },
        stores: []
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        ...mockUpdateData,
        profile: {
          ...mockUser.profile,
          avatar: mockUpdateData.avatar,
          bio: mockUpdateData.bio
        }
      } as any);

      const result = await authService.updateUserProfile('user123', mockUpdateData);

      expect(result).toBeDefined();
      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
      expect(result.profile.avatar).toBe('https://example.com/new-avatar.jpg');
    });
  });

  describe('changePassword', () => {
    const mockPasswordData = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123'
    };

    it('should change password successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password: 'hashedOldPassword'
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockBcrypt.hash.mockResolvedValue('hashedNewPassword' as never);
      mockPrisma.user.update.mockResolvedValue(mockUser as any);

      await expect(authService.changePassword('user123', mockPasswordData)).resolves.not.toThrow();
      expect(mockBcrypt.compare).toHaveBeenCalledWith('oldPassword', 'hashedOldPassword');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
    });

    it('should throw error for incorrect current password', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password: 'hashedOldPassword'
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(authService.changePassword('user123', mockPasswordData)).rejects.toThrow(
        'Current password is incorrect'
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
      mockJwt.sign.mockReturnValue('resetToken' as never);
      mockPrisma.user.update.mockResolvedValue(mockUser as any);

      await expect(authService.forgotPassword('test@example.com')).resolves.not.toThrow();
      expect(mockJwt.sign).toHaveBeenCalled();
    });

    it('should not throw error for non-existent email', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(authService.forgotPassword('nonexistent@example.com')).resolves.not.toThrow();
    });
  });

  describe('resetPassword', () => {
    const mockResetData = {
      token: 'validResetToken',
      newPassword: 'newPassword123'
    };

    it('should reset password successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        passwordResetToken: 'validResetToken',
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000) // Future date
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
      mockBcrypt.hash.mockResolvedValue('hashedNewPassword' as never);
      mockPrisma.user.update.mockResolvedValue(mockUser as any);

      await expect(authService.resetPassword(mockResetData)).resolves.not.toThrow();
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
    });

    it('should throw error for invalid reset token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(authService.resetPassword(mockResetData)).rejects.toThrow(
        'Invalid or expired reset token'
      );
    });
  });
}); 