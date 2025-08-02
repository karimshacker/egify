import { Request, Response } from 'express';
import { authService } from '@/services/authService';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { 
  validateUserRegistration, 
  validateUserLogin, 
  validateUserUpdate,
  validatePasswordChange,
  validatePasswordReset
} from '@/middleware/validation';

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;
    
    const result = await authService.registerUser(userData);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  });

  /**
   * Login user
   * POST /api/auth/login
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    const result = await authService.loginUser({ email, password });
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  });

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    const result = await authService.refreshAccessToken(refreshToken);
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  });

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const userId = req.user?.id;
    
    await authService.logoutUser(userId, refreshToken);
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  });

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    
    const user = await authService.getUserById(userId);
    
    res.status(200).json({
      success: true,
      data: user
    });
  });

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const updateData = req.body;
    
    const user = await authService.updateUserProfile(userId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  });

  /**
   * Change password
   * PUT /api/auth/change-password
   */
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    
    await authService.changePassword(userId, currentPassword, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  });

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    await authService.requestPasswordReset(email);
    
    res.status(200).json({
      success: true,
      message: 'Password reset email sent if account exists'
    });
  });

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    
    await authService.resetPassword(token, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  });

  /**
   * Verify email
   * POST /api/auth/verify-email
   */
  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    
    await authService.verifyEmail(token);
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  });

  /**
   * Resend verification email
   * POST /api/auth/resend-verification
   */
  resendVerification = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    await authService.resendVerificationEmail(email);
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent'
    });
  });
}

export const authController = new AuthController(); 