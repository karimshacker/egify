import { PrismaClient } from '@prisma/client';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: number;
  isAvailable: boolean;
}

export interface ShippingCalculation {
  methods: ShippingMethod[];
  totalWeight: number;
  totalItems: number;
}

export interface ShippingZone {
  id: string;
  name: string;
  description?: string;
  countries: string[];
  states?: string[];
  postalCodes?: string[];
  rates: ShippingRate[];
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingRate {
  id: string;
  name: string;
  price: number;
  minOrderValue?: number;
  maxOrderValue?: number;
  estimatedDays: number;
  isActive: boolean;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery?: Date;
  events: TrackingEvent[];
}

export interface TrackingEvent {
  timestamp: Date;
  location: string;
  status: string;
  description: string;
}

export interface ShippingCarrier {
  id: string;
  name: string;
  code: string;
  website: string;
  trackingUrl: string;
  isActive: boolean;
}

export const shippingService = {
  /**
   * Get available shipping methods for a store
   */
  async getShippingMethods(
    storeId: string,
    filters: { country?: string; postalCode?: string }
  ): Promise<ShippingMethod[]> {
    // Get store settings
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { settings: true },
    });

    if (!store) {
      throw new ApiError(404, 'Store not found');
    }

    if (!store.settings?.shippingEnabled) {
      return [];
    }

    // Get shipping zones that match the destination
    const zones = await this.getMatchingShippingZones(storeId, filters);

    const methods: ShippingMethod[] = [];

    // Add zone-based shipping methods
    zones.forEach(zone => {
      zone.rates.forEach(rate => {
        if (rate.isActive) {
          methods.push({
            id: rate.id,
            name: rate.name,
            description: `${rate.estimatedDays} business days`,
            price: Number(rate.price),
            estimatedDays: rate.estimatedDays,
            isAvailable: true,
          });
        }
      });
    });

    // Add default shipping methods if no zones match
    if (methods.length === 0) {
      methods.push({
        id: 'standard',
        name: 'Standard Shipping',
        description: '5-7 business days',
        price: 5.99,
        estimatedDays: 6,
        isAvailable: true,
      });

      methods.push({
        id: 'express',
        name: 'Express Shipping',
        description: '2-3 business days',
        price: 12.99,
        estimatedDays: 3,
        isAvailable: true,
      });
    }

    return methods;
  },

  /**
   * Calculate shipping costs for items
   */
  async calculateShipping(
    storeId: string,
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      weight?: number;
    }>,
    destination: {
      country: string;
      state?: string;
      city?: string;
      postalCode?: string;
    }
  ): Promise<ShippingCalculation> {
    // Calculate total weight and items
    let totalWeight = 0;
    let totalItems = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          variants: item.variantId ? { where: { id: item.variantId } } : false,
        },
      });

      if (product) {
        const weight = item.variantId && product.variants[0]
          ? Number(product.variants[0].weight || 0)
          : Number(product.weight || 0);

        totalWeight += weight * item.quantity;
        totalItems += item.quantity;
      }
    }

    // Get shipping methods
    const methods = await this.getShippingMethods(storeId, {
      country: destination.country,
      postalCode: destination.postalCode,
    });

    // Apply weight-based pricing adjustments
    const adjustedMethods = methods.map(method => {
      let adjustedPrice = method.price;

      // Add weight-based surcharge for heavy items
      if (totalWeight > 10) {
        adjustedPrice += Math.ceil((totalWeight - 10) / 5) * 2; // $2 per 5 lbs over 10 lbs
      }

      // Add quantity-based discount
      if (totalItems > 5) {
        adjustedPrice *= 0.9; // 10% discount for orders with more than 5 items
      }

      return {
        ...method,
        price: Math.round(adjustedPrice * 100) / 100, // Round to 2 decimal places
      };
    });

    return {
      methods: adjustedMethods,
      totalWeight,
      totalItems,
    };
  },

  /**
   * Track shipment
   */
  async trackShipment(trackingNumber: string, carrier?: string): Promise<TrackingInfo> {
    // This would typically integrate with shipping carrier APIs
    // For now, return mock tracking information
    const mockTracking: TrackingInfo = {
      trackingNumber,
      carrier: carrier || 'Unknown',
      status: 'In Transit',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      events: [
        {
          timestamp: new Date(),
          location: 'Distribution Center',
          status: 'In Transit',
          description: 'Package has left the distribution center',
        },
        {
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          location: 'Origin Facility',
          status: 'Picked Up',
          description: 'Package has been picked up by carrier',
        },
      ],
    };

    logger.info(`Tracking requested for: ${trackingNumber}`);
    return mockTracking;
  },

  /**
   * Get shipping zones for store
   */
  async getShippingZones(storeId: string, userId?: string): Promise<ShippingZone[]> {
    // Verify user has access to store
    if (userId) {
      const store = await prisma.store.findFirst({
        where: { id: storeId, ownerId: userId },
      });

      if (!store) {
        throw new ApiError(403, 'Access denied to store');
      }
    }

    // In a real implementation, this would query a shipping_zones table
    // For now, return mock data
    const mockZones: ShippingZone[] = [
      {
        id: 'zone-1',
        name: 'Domestic US',
        description: 'Continental United States',
        countries: ['US'],
        rates: [
          {
            id: 'rate-1',
            name: 'Standard Ground',
            price: 5.99,
            estimatedDays: 5,
            isActive: true,
          },
          {
            id: 'rate-2',
            name: 'Express',
            price: 12.99,
            estimatedDays: 2,
            isActive: true,
          },
        ],
        storeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return mockZones;
  },

  /**
   * Create shipping zone
   */
  async createShippingZone(zoneData: any, userId: string): Promise<ShippingZone> {
    // Verify user owns the store
    const store = await prisma.store.findFirst({
      where: { id: zoneData.storeId, ownerId: userId },
    });

    if (!store) {
      throw new ApiError(403, 'Access denied to store');
    }

    // In a real implementation, this would create a record in shipping_zones table
    const newZone: ShippingZone = {
      id: `zone-${Date.now()}`,
      name: zoneData.name,
      description: zoneData.description,
      countries: zoneData.countries || [],
      states: zoneData.states || [],
      postalCodes: zoneData.postalCodes || [],
      rates: zoneData.rates || [],
      storeId: zoneData.storeId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    logger.info(`Shipping zone created: ${newZone.id} for store: ${zoneData.storeId}`);
    return newZone;
  },

  /**
   * Update shipping zone
   */
  async updateShippingZone(
    zoneId: string,
    updateData: any,
    userId: string
  ): Promise<ShippingZone> {
    // In a real implementation, this would update a record in shipping_zones table
    // For now, return mock updated zone
    const updatedZone: ShippingZone = {
      id: zoneId,
      name: updateData.name || 'Updated Zone',
      description: updateData.description,
      countries: updateData.countries || [],
      states: updateData.states || [],
      postalCodes: updateData.postalCodes || [],
      rates: updateData.rates || [],
      storeId: 'store-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    logger.info(`Shipping zone updated: ${zoneId}`);
    return updatedZone;
  },

  /**
   * Delete shipping zone
   */
  async deleteShippingZone(zoneId: string, userId: string): Promise<void> {
    // In a real implementation, this would delete a record from shipping_zones table
    logger.info(`Shipping zone deleted: ${zoneId}`);
  },

  /**
   * Get available shipping carriers
   */
  async getShippingCarriers(): Promise<ShippingCarrier[]> {
    const carriers: ShippingCarrier[] = [
      {
        id: 'ups',
        name: 'United Parcel Service',
        code: 'UPS',
        website: 'https://www.ups.com',
        trackingUrl: 'https://www.ups.com/track?tracknum={tracking_number}',
        isActive: true,
      },
      {
        id: 'fedex',
        name: 'Federal Express',
        code: 'FedEx',
        website: 'https://www.fedex.com',
        trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}',
        isActive: true,
      },
      {
        id: 'usps',
        name: 'United States Postal Service',
        code: 'USPS',
        website: 'https://www.usps.com',
        trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}',
        isActive: true,
      },
      {
        id: 'dhl',
        name: 'DHL Express',
        code: 'DHL',
        website: 'https://www.dhl.com',
        trackingUrl: 'https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}',
        isActive: true,
      },
    ];

    return carriers;
  },

  /**
   * Get shipping rates for store
   */
  async getShippingRates(storeId: string, userId?: string): Promise<ShippingRate[]> {
    // Verify user has access to store
    if (userId) {
      const store = await prisma.store.findFirst({
        where: { id: storeId, ownerId: userId },
      });

      if (!store) {
        throw new ApiError(403, 'Access denied to store');
      }
    }

    // In a real implementation, this would query shipping_rates table
    const mockRates: ShippingRate[] = [
      {
        id: 'rate-1',
        name: 'Standard Ground',
        price: 5.99,
        estimatedDays: 5,
        isActive: true,
      },
      {
        id: 'rate-2',
        name: 'Express',
        price: 12.99,
        estimatedDays: 2,
        isActive: true,
      },
      {
        id: 'rate-3',
        name: 'Overnight',
        price: 24.99,
        estimatedDays: 1,
        isActive: true,
      },
    ];

    return mockRates;
  },

  /**
   * Get matching shipping zones for destination
   */
  private async getMatchingShippingZones(
    storeId: string,
    filters: { country?: string; postalCode?: string }
  ): Promise<ShippingZone[]> {
    // In a real implementation, this would query shipping_zones table
    // and match based on country, state, and postal code patterns
    const zones = await this.getShippingZones(storeId);

    return zones.filter(zone => {
      if (filters.country && !zone.countries.includes(filters.country)) {
        return false;
      }

      // Add more complex matching logic for states and postal codes
      return true;
    });
  },
}; 