import { Request, Response } from 'express';
import { marketingService } from '@/services/marketingService';
import { logger } from '@/utils/logger';
import { ApiError } from '@/utils/ApiError';
import { catchAsync } from '@/utils/catchAsync';

export const marketingController = {
  /**
   * Get marketing campaigns for store
   */
  getCampaigns: catchAsync(async (req: Request, res: Response) => {
    const { storeId, status, page = 1, limit = 20 } = req.query;
    const userId = req.user?.id;

    if (!storeId) {
      throw new ApiError(400, 'Store ID is required');
    }

    const campaigns = await marketingService.getCampaigns(
      storeId as string,
      userId,
      {
        status: status as string,
        page: Number(page),
        limit: Number(limit),
      }
    );

    res.status(200).json({
      success: true,
      data: campaigns,
    });
  }),

  /**
   * Create new marketing campaign
   */
  createCampaign: catchAsync(async (req: Request, res: Response) => {
    const campaignData = req.body;
    const userId = req.user?.id;

    const newCampaign = await marketingService.createCampaign(campaignData, userId);

    res.status(201).json({
      success: true,
      data: newCampaign,
      message: 'Campaign created successfully',
    });
  }),

  /**
   * Get campaign details
   */
  getCampaign: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const campaign = await marketingService.getCampaign(id, userId);

    res.status(200).json({
      success: true,
      data: campaign,
    });
  }),

  /**
   * Update campaign
   */
  updateCampaign: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.id;

    const updatedCampaign = await marketingService.updateCampaign(id, updateData, userId);

    res.status(200).json({
      success: true,
      data: updatedCampaign,
      message: 'Campaign updated successfully',
    });
  }),

  /**
   * Launch campaign
   */
  launchCampaign: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    await marketingService.launchCampaign(id, userId);

    res.status(200).json({
      success: true,
      message: 'Campaign launched successfully',
    });
  }),

  /**
   * Pause campaign
   */
  pauseCampaign: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    await marketingService.pauseCampaign(id, userId);

    res.status(200).json({
      success: true,
      message: 'Campaign paused successfully',
    });
  }),

  /**
   * Delete campaign
   */
  deleteCampaign: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    await marketingService.deleteCampaign(id, userId);

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  }),

  /**
   * Get campaign analytics
   */
  getCampaignAnalytics: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.user?.id;

    const analytics = await marketingService.getCampaignAnalytics(
      id,
      userId,
      {
        startDate: startDate as string,
        endDate: endDate as string,
      }
    );

    res.status(200).json({
      success: true,
      data: analytics,
    });
  }),

  /**
   * Get email templates for store
   */
  getEmailTemplates: catchAsync(async (req: Request, res: Response) => {
    const { storeId } = req.query;
    const userId = req.user?.id;

    if (!storeId) {
      throw new ApiError(400, 'Store ID is required');
    }

    const templates = await marketingService.getEmailTemplates(storeId as string, userId);

    res.status(200).json({
      success: true,
      data: templates,
    });
  }),

  /**
   * Create email template
   */
  createEmailTemplate: catchAsync(async (req: Request, res: Response) => {
    const templateData = req.body;
    const userId = req.user?.id;

    const newTemplate = await marketingService.createEmailTemplate(templateData, userId);

    res.status(201).json({
      success: true,
      data: newTemplate,
      message: 'Email template created successfully',
    });
  }),

  /**
   * Update email template
   */
  updateEmailTemplate: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.id;

    const updatedTemplate = await marketingService.updateEmailTemplate(id, updateData, userId);

    res.status(200).json({
      success: true,
      data: updatedTemplate,
      message: 'Email template updated successfully',
    });
  }),

  /**
   * Delete email template
   */
  deleteEmailTemplate: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    await marketingService.deleteEmailTemplate(id, userId);

    res.status(200).json({
      success: true,
      message: 'Email template deleted successfully',
    });
  }),

  /**
   * Get email subscribers for store
   */
  getSubscribers: catchAsync(async (req: Request, res: Response) => {
    const { storeId, status, page = 1, limit = 20 } = req.query;
    const userId = req.user?.id;

    if (!storeId) {
      throw new ApiError(400, 'Store ID is required');
    }

    const subscribers = await marketingService.getSubscribers(
      storeId as string,
      userId,
      {
        status: status as string,
        page: Number(page),
        limit: Number(limit),
      }
    );

    res.status(200).json({
      success: true,
      data: subscribers,
    });
  }),

  /**
   * Add email subscriber
   */
  addSubscriber: catchAsync(async (req: Request, res: Response) => {
    const subscriberData = req.body;

    const newSubscriber = await marketingService.addSubscriber(subscriberData);

    res.status(201).json({
      success: true,
      data: newSubscriber,
      message: 'Subscriber added successfully',
    });
  }),

  /**
   * Unsubscribe from emails
   */
  unsubscribe: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    await marketingService.unsubscribe(id);

    res.status(200).json({
      success: true,
      message: 'Unsubscribed successfully',
    });
  }),
}; 