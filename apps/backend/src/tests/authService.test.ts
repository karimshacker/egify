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

      // Mock refresh token creation
      (mockPrisma as any).refreshToken = {
        create: jest.fn().mockResolvedValue({
          id: 'token123',
          token: 'refreshToken',
          userId: 'user123',
          expiresAt: new Date(),
          createdAt: new Date()
        })
      };

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

      // Mock refresh token creation
      (mockPrisma as any).refreshToken = {
        create: jest.fn().mockResolvedValue({
          id: 'token123',
          token: 'refreshToken',
          userId: 'user123',
          expiresAt: new Date(),
          createdAt: new Date()
        })
      };

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

  describe('logoutUser', () => {
    it('should logout user successfully', async () => {
      // Mock refresh token deletion
      (mockPrisma as any).refreshToken = {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 })
      };

      await expect(authService.logoutUser('user123')).resolves.not.toThrow();
      expect((mockPrisma as any).refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user123' }
      });
    });
  });
}); 