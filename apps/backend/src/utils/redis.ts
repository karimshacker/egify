import Redis from 'ioredis';
import { logger } from './logger';

class RedisClient {
  private static instance: RedisClient;
  private redis: Redis;

  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
      retryDelayOnClusterDown: 300,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      maxLoadingTimeout: 10000,
    });

    // Handle connection events
    this.redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    this.redis.on('ready', () => {
      logger.info('Redis is ready');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    this.redis.on('close', () => {
      logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    this.redis.on('end', () => {
      logger.warn('Redis connection ended');
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public getClient(): Redis {
    return this.redis;
  }

  public async connect(): Promise<void> {
    try {
      await this.redis.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.redis.disconnect();
      logger.info('Redis disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from Redis:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  // Cache operations
  public async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      logger.error(`Failed to get key ${key}:`, error);
      return null;
    }
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.redis.setex(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      logger.error(`Failed to set key ${key}:`, error);
      throw error;
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error(`Failed to delete key ${key}:`, error);
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Failed to check existence of key ${key}:`, error);
      return false;
    }
  }

  public async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl);
    } catch (error) {
      logger.error(`Failed to set expiry for key ${key}:`, error);
      throw error;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error(`Failed to get TTL for key ${key}:`, error);
      return -1;
    }
  }

  // Hash operations
  public async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.redis.hget(key, field);
    } catch (error) {
      logger.error(`Failed to hget key ${key} field ${field}:`, error);
      return null;
    }
  }

  public async hset(key: string, field: string, value: string): Promise<void> {
    try {
      await this.redis.hset(key, field, value);
    } catch (error) {
      logger.error(`Failed to hset key ${key} field ${field}:`, error);
      throw error;
    }
  }

  public async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      return await this.redis.hgetall(key);
    } catch (error) {
      logger.error(`Failed to hgetall key ${key}:`, error);
      return null;
    }
  }

  public async hdel(key: string, field: string): Promise<void> {
    try {
      await this.redis.hdel(key, field);
    } catch (error) {
      logger.error(`Failed to hdel key ${key} field ${field}:`, error);
      throw error;
    }
  }

  // List operations
  public async lpush(key: string, value: string): Promise<void> {
    try {
      await this.redis.lpush(key, value);
    } catch (error) {
      logger.error(`Failed to lpush key ${key}:`, error);
      throw error;
    }
  }

  public async rpush(key: string, value: string): Promise<void> {
    try {
      await this.redis.rpush(key, value);
    } catch (error) {
      logger.error(`Failed to rpush key ${key}:`, error);
      throw error;
    }
  }

  public async lpop(key: string): Promise<string | null> {
    try {
      return await this.redis.lpop(key);
    } catch (error) {
      logger.error(`Failed to lpop key ${key}:`, error);
      return null;
    }
  }

  public async rpop(key: string): Promise<string | null> {
    try {
      return await this.redis.rpop(key);
    } catch (error) {
      logger.error(`Failed to rpop key ${key}:`, error);
      return null;
    }
  }

  public async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.redis.lrange(key, start, stop);
    } catch (error) {
      logger.error(`Failed to lrange key ${key}:`, error);
      return [];
    }
  }

  // Set operations
  public async sadd(key: string, member: string): Promise<void> {
    try {
      await this.redis.sadd(key, member);
    } catch (error) {
      logger.error(`Failed to sadd key ${key}:`, error);
      throw error;
    }
  }

  public async srem(key: string, member: string): Promise<void> {
    try {
      await this.redis.srem(key, member);
    } catch (error) {
      logger.error(`Failed to srem key ${key}:`, error);
      throw error;
    }
  }

  public async smembers(key: string): Promise<string[]> {
    try {
      return await this.redis.smembers(key);
    } catch (error) {
      logger.error(`Failed to smembers key ${key}:`, error);
      return [];
    }
  }

  public async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.redis.sismember(key, member);
      return result === 1;
    } catch (error) {
      logger.error(`Failed to sismember key ${key}:`, error);
      return false;
    }
  }

  // Utility methods
  public async flushdb(): Promise<void> {
    try {
      await this.redis.flushdb();
      logger.info('Redis database flushed');
    } catch (error) {
      logger.error('Failed to flush Redis database:', error);
      throw error;
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      logger.error(`Failed to get keys with pattern ${pattern}:`, error);
      return [];
    }
  }
}

// Export singleton instance
export const redis = RedisClient.getInstance();

// Export Redis client for direct use
export const redisClient = redis.getClient();

// Connect function for app initialization
export async function connectRedis(): Promise<void> {
  await redis.connect();
}

// Disconnect function for graceful shutdown
export async function disconnectRedis(): Promise<void> {
  await redis.disconnect();
}

// Health check function
export async function checkRedisHealth(): Promise<boolean> {
  return await redis.healthCheck();
}

// Export Redis client instance for testing
export { RedisClient }; 