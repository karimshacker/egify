import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';
import { notificationService } from './notificationService';

export interface InventoryUpdate {
  variantId: string;
  quantity: number;
  operation: 'add' | 'subtract' | 'set';
  reason: string;
  notes?: string;
}

export interface LowStockAlert {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  currentStock: number;
  threshold: number;
  lastUpdated: Date;
}

export interface InventoryMovement {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  quantity: number;
  operation: string;
  reason: string;
  previousStock: number;
  newStock: number;
  notes?: string;
  createdAt: Date;
}

export class InventoryService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Update inventory for a product variant
   */
  async updateInventory(storeId: string, update: InventoryUpdate): Promise<any> {
    try {
      // Get current variant
      const variant = await this.prisma.productVariant.findFirst({
        where: {
          id: update.variantId,
          product: { storeId }
        },
        include: {
          product: {
            select: { name: true, lowStockThreshold: true }
          }
        }
      });

      if (!variant) {
        throw new Error('Product variant not found');
      }

      const previousStock = variant.inventory;
      let newStock: number;

      // Calculate new stock based on operation
      switch (update.operation) {
        case 'add':
          newStock = previousStock + update.quantity;
          break;
        case 'subtract':
          newStock = Math.max(0, previousStock - update.quantity);
          break;
        case 'set':
          newStock = Math.max(0, update.quantity);
          break;
        default:
          throw new Error('Invalid operation');
      }

      // Update inventory
      const updatedVariant = await this.prisma.productVariant.update({
        where: { id: update.variantId },
        data: { inventory: newStock },
        include: {
          product: {
            select: { name: true, lowStockThreshold: true }
          }
        }
      });

      // Log inventory movement
      await this.logInventoryMovement({
        variantId: update.variantId,
        productId: variant.productId,
        productName: variant.product.name,
        variantName: variant.name,
        quantity: Math.abs(newStock - previousStock),
        operation: update.operation,
        reason: update.reason,
        previousStock,
        newStock,
        notes: update.notes
      });

      // Check for low stock alert
      if (newStock <= variant.product.lowStockThreshold && previousStock > variant.product.lowStockThreshold) {
        await this.sendLowStockAlert(updatedVariant);
      }

      logger.info(`Inventory updated for variant ${update.variantId}: ${previousStock} -> ${newStock}`);

      return {
        variantId: update.variantId,
        previousStock,
        newStock,
        change: newStock - previousStock
      };
    } catch (error) {
      logger.error('Error updating inventory:', error);
      throw error;
    }
  }

  /**
   * Bulk update inventory for multiple variants
   */
  async bulkUpdateInventory(storeId: string, updates: InventoryUpdate[]): Promise<any[]> {
    try {
      const results = [];
      
      for (const update of updates) {
        try {
          const result = await this.updateInventory(storeId, update);
          results.push({ success: true, ...result });
        } catch (error) {
          results.push({ 
            success: false, 
            variantId: update.variantId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error in bulk inventory update:', error);
      throw error;
    }
  }

  /**
   * Get low stock alerts for a store
   */
  async getLowStockAlerts(storeId: string): Promise<LowStockAlert[]> {
    try {
      const variants = await this.prisma.productVariant.findMany({
        where: {
          product: { storeId },
          inventory: {
            lte: this.prisma.product.fields.lowStockThreshold
          }
        },
        include: {
          product: {
            select: { name: true, lowStockThreshold: true }
          }
        }
      });

      return variants.map(variant => ({
        variantId: variant.id,
        productId: variant.productId,
        productName: variant.product.name,
        variantName: variant.name,
        currentStock: variant.inventory,
        threshold: variant.product.lowStockThreshold,
        lastUpdated: variant.updatedAt
      }));
    } catch (error) {
      logger.error('Error getting low stock alerts:', error);
      throw error;
    }
  }

  /**
   * Get inventory movements for a product
   */
  async getInventoryMovements(productId: string, page: number = 1, limit: number = 20): Promise<{
    movements: InventoryMovement[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    try {
      const skip = (page - 1) * limit;

      const [movements, total] = await Promise.all([
        this.prisma.inventoryMovement.findMany({
          where: { productId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.inventoryMovement.count({
          where: { productId }
        })
      ]);

      return {
        movements: movements.map(movement => ({
          id: movement.id,
          variantId: movement.variantId,
          productId: movement.productId,
          productName: movement.productName,
          variantName: movement.variantName,
          quantity: movement.quantity,
          operation: movement.operation,
          reason: movement.reason,
          previousStock: movement.previousStock,
          newStock: movement.newStock,
          notes: movement.notes,
          createdAt: movement.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting inventory movements:', error);
      throw error;
    }
  }

  /**
   * Get inventory summary for a store
   */
  async getInventorySummary(storeId: string): Promise<any> {
    try {
      const [totalProducts, lowStockCount, outOfStockCount, totalValue] = await Promise.all([
        this.prisma.product.count({ where: { storeId } }),
        this.prisma.productVariant.count({
          where: {
            product: { storeId },
            inventory: {
              lte: this.prisma.product.fields.lowStockThreshold,
              gt: 0
            }
          }
        }),
        this.prisma.productVariant.count({
          where: {
            product: { storeId },
            inventory: 0
          }
        }),
        this.prisma.productVariant.aggregate({
          where: {
            product: { storeId }
          },
          _sum: {
            inventory: true
          }
        })
      ]);

      return {
        totalProducts,
        lowStockCount,
        outOfStockCount,
        totalStockUnits: totalValue._sum.inventory || 0,
        stockHealth: totalProducts > 0 ? ((totalProducts - lowStockCount - outOfStockCount) / totalProducts) * 100 : 0
      };
    } catch (error) {
      logger.error('Error getting inventory summary:', error);
      throw error;
    }
  }

  /**
   * Get inventory by category
   */
  async getInventoryByCategory(storeId: string): Promise<any[]> {
    try {
      const categories = await this.prisma.category.findMany({
        where: { storeId },
        include: {
          products: {
            include: {
              variants: true
            }
          }
        }
      });

      return categories.map(category => {
        const totalStock = category.products.reduce((sum, product) => {
          return sum + product.variants.reduce((variantSum, variant) => variantSum + variant.inventory, 0);
        }, 0);

        const lowStockProducts = category.products.filter(product => 
          product.variants.some(variant => 
            variant.inventory <= product.lowStockThreshold && variant.inventory > 0
          )
        ).length;

        return {
          categoryId: category.id,
          categoryName: category.name,
          productCount: category.products.length,
          totalStock,
          lowStockProducts
        };
      });
    } catch (error) {
      logger.error('Error getting inventory by category:', error);
      throw error;
    }
  }

  /**
   * Get inventory trends
   */
  async getInventoryTrends(storeId: string, period: string = '30d'): Promise<any[]> {
    try {
      const startDate = this.getStartDate(period);

      const movements = await this.prisma.inventoryMovement.findMany({
        where: {
          product: { storeId },
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Group by date and calculate daily changes
      const dailyChanges: Record<string, number> = {};
      
      movements.forEach(movement => {
        const date = movement.createdAt.toISOString().split('T')[0];
        const change = movement.newStock - movement.previousStock;
        dailyChanges[date] = (dailyChanges[date] || 0) + change;
      });

      return Object.entries(dailyChanges).map(([date, change]) => ({
        date,
        change,
        cumulative: 0 // Would need to calculate cumulative based on previous days
      }));
    } catch (error) {
      logger.error('Error getting inventory trends:', error);
      throw error;
    }
  }

  /**
   * Export inventory data
   */
  async exportInventory(storeId: string, format: 'json' | 'csv' = 'json'): Promise<any> {
    try {
      const products = await this.prisma.product.findMany({
        where: { storeId },
        include: {
          category: { select: { name: true } },
          variants: true
        }
      });

      const inventoryData = products.map(product => ({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: product.category?.name || 'Uncategorized',
        variants: product.variants.map(variant => ({
          variantId: variant.id,
          variantName: variant.name,
          sku: variant.sku,
          inventory: variant.inventory,
          price: variant.price,
          isActive: variant.isActive
        })),
        totalStock: product.variants.reduce((sum, v) => sum + v.inventory, 0),
        lowStockVariants: product.variants.filter(v => v.inventory <= product.lowStockThreshold).length
      }));

      if (format === 'csv') {
        // TODO: Implement CSV export
        return { format: 'csv', data: 'CSV export not implemented yet' };
      }

      return { format: 'json', data: inventoryData };
    } catch (error) {
      logger.error('Error exporting inventory:', error);
      throw error;
    }
  }

  // Private helper methods

  private async logInventoryMovement(movement: Omit<InventoryMovement, 'id' | 'createdAt'>): Promise<void> {
    try {
      await this.prisma.inventoryMovement.create({
        data: {
          variantId: movement.variantId,
          productId: movement.productId,
          productName: movement.productName,
          variantName: movement.variantName,
          quantity: movement.quantity,
          operation: movement.operation,
          reason: movement.reason,
          previousStock: movement.previousStock,
          newStock: movement.newStock,
          notes: movement.notes
        }
      });
    } catch (error) {
      logger.error('Error logging inventory movement:', error);
    }
  }

  private async sendLowStockAlert(variant: any): Promise<void> {
    try {
      await notificationService.sendInventoryNotification(
        { id: variant.productId, name: variant.product.name, storeId: variant.product.storeId },
        variant
      );
    } catch (error) {
      logger.error('Error sending low stock alert:', error);
    }
  }

  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}

export const inventoryService = new InventoryService(); 