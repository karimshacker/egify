import { Request, Response } from 'express';
import { shippingService } from '@/services/shippingService';
import { logger } from '@/utils/logger';
import { ApiError } from '@/utils/ApiError';
import { catchAsync } from '@/utils/catchAsync';

export const shippingController = {
  /**
   * Get available shipping methods
   */
  getShippingMethods: catchAsync(async (req: Request, res: Response) => {
    const { storeId, country, postalCode } = req.query;

    if (!storeId) {
      throw new ApiError(400, 'Store ID is required');
    }

    const methods = await shippingService.getShippingMethods(
      storeId as string,
      {
        country: country as string,
        postalCode: postalCode as string,
      }
    );

    res.status(200).json({
      success: true,
      data: methods,
    });
  }),

  /**
   * Calculate shipping costs
   */
  calculateShipping: catchAsync(async (req: Request, res: Response) => {
    const { storeId, items, destination } = req.body;

    const shippingCosts = await shippingService.calculateShipping(
      storeId,
      items,
      destination
    );

    res.status(200).json({
      success: true,
      data: shippingCosts,
    });
  }),

  /**
   * Track shipment
   */
  trackShipment: catchAsync(async (req: Request, res: Response) => {
    const { trackingNumber } = req.params;
    const { carrier } = req.query;

    const trackingInfo = await shippingService.trackShipment(
      trackingNumber,
      carrier as string
    );

    res.status(200).json({
      success: true,
      data: trackingInfo,
    });
  }),

  /**
   * Get shipping zones for store
   */
  getShippingZones: catchAsync(async (req: Request, res: Response) => {
    const { storeId } = req.query;
    const userId = req.user?.id;

    if (!storeId) {
      throw new ApiError(400, 'Store ID is required');
    }

    const zones = await shippingService.getShippingZones(storeId as string, userId);

    res.status(200).json({
      success: true,
      data: zones,
    });
  }),

  /**
   * Create shipping zone
   */
  createShippingZone: catchAsync(async (req: Request, res: Response) => {
    const zoneData = req.body;
    const userId = req.user?.id;

    const newZone = await shippingService.createShippingZone(zoneData, userId);

    res.status(201).json({
      success: true,
      data: newZone,
      message: 'Shipping zone created successfully',
    });
  }),

  /**
   * Update shipping zone
   */
  updateShippingZone: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.id;

    const updatedZone = await shippingService.updateShippingZone(id, updateData, userId);

    res.status(200).json({
      success: true,
      data: updatedZone,
      message: 'Shipping zone updated successfully',
    });
  }),

  /**
   * Delete shipping zone
   */
  deleteShippingZone: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    await shippingService.deleteShippingZone(id, userId);

    res.status(200).json({
      success: true,
      message: 'Shipping zone deleted successfully',
    });
  }),

  /**
   * Get available shipping carriers
   */
  getShippingCarriers: catchAsync(async (req: Request, res: Response) => {
    const carriers = await shippingService.getShippingCarriers();

    res.status(200).json({
      success: true,
      data: carriers,
    });
  }),

  /**
   * Get shipping rates for store
   */
  getShippingRates: catchAsync(async (req: Request, res: Response) => {
    const { storeId } = req.query;
    const userId = req.user?.id;

    if (!storeId) {
      throw new ApiError(400, 'Store ID is required');
    }

    const rates = await shippingService.getShippingRates(storeId as string, userId);

    res.status(200).json({
      success: true,
      data: rates,
    });
  }),
}; 