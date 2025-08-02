import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

class Database {
  private static instance: Database;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Handle connection events
    this.prisma.$on('query', (e) => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`Query: ${e.query}`);
        logger.debug(`Params: ${e.params}`);
        logger.debug(`Duration: ${e.duration}ms`);
      }
    });

    this.prisma.$on('error', (e) => {
      logger.error('Prisma error:', e);
    });

    this.prisma.$on('info', (e) => {
      logger.info('Prisma info:', e);
    });

    this.prisma.$on('warn', (e) => {
      logger.warn('Prisma warning:', e);
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from database:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const db = Database.getInstance();

// Export Prisma client for direct use
export const prisma = db.getClient();

// Connect function for app initialization
export async function connectDatabase(): Promise<void> {
  await db.connect();
}

// Disconnect function for graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await db.disconnect();
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  return await db.healthCheck();
}

// Export database instance for testing
export { Database }; 