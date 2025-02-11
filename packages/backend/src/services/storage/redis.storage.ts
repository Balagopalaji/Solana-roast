import { Redis } from 'ioredis';
import { BaseStorageService, StorageConfig } from './base-storage.service';
import logger from '../../utils/logger';

export class RedisStorage<T> extends BaseStorageService<T> {
  private redis: Redis;

  constructor(config: StorageConfig = {}) {
    super(config);
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }
    this.redis = new Redis(redisUrl);
    logger.info('RedisStorage initialized', { prefix: this.prefix });
  }

  async get(key: string): Promise<T | null> {
    try {
      await this.validateKey(key);
      const data = await this.redis.get(this.getKey(key));
      
      if (!data) {
        this.logOperation('get', key);
        return null;
      }

      const parsed = JSON.parse(data) as T;
      this.logOperation('get', key);
      return parsed;
    } catch (error: unknown) {
      this.logOperation('get', key, error);
      throw error;
    }
  }

  async set(key: string, value: T): Promise<void> {
    try {
      await this.validateKey(key);
      await this.validateValue(value);

      const data = JSON.stringify(value);
      const fullKey = this.getKey(key);

      if (this.ttl) {
        await this.redis.setex(fullKey, this.ttl, data);
      } else {
        await this.redis.set(fullKey, data);
      }

      this.logOperation('set', key);
    } catch (error: unknown) {
      this.logOperation('set', key, error);
      throw error;
    }
  }

  async list(pattern: string): Promise<T[]> {
    try {
      const keys = await this.redis.keys(this.getKey(pattern));
      if (keys.length === 0) {
        this.logOperation('list', pattern);
        return [];
      }

      const values = await this.redis.mget(keys);
      const parsed = values
        .filter(Boolean)
        .map(value => JSON.parse(value!) as T);

      this.logOperation('list', pattern);
      return parsed;
    } catch (error: unknown) {
      this.logOperation('list', pattern, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.validateKey(key);
      await this.redis.del(this.getKey(key));
      this.logOperation('delete', key);
    } catch (error: unknown) {
      this.logOperation('delete', key, error);
      throw error;
    }
  }

  // Additional Redis-specific methods
  async setWithExpiry(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.validateKey(key);
      await this.validateValue(value);

      const data = JSON.stringify(value);
      await this.redis.setex(this.getKey(key), ttlSeconds, data);
      
      this.logOperation('setWithExpiry', key);
    } catch (error: unknown) {
      this.logOperation('setWithExpiry', key, error);
      throw error;
    }
  }

  async getTimeToLive(key: string): Promise<number | null> {
    try {
      await this.validateKey(key);
      const ttl = await this.redis.ttl(this.getKey(key));
      
      this.logOperation('getTimeToLive', key);
      return ttl;
    } catch (error: unknown) {
      this.logOperation('getTimeToLive', key, error);
      throw error;
    }
  }

  async increment(key: string): Promise<number> {
    try {
      await this.validateKey(key);
      const value = await this.redis.incr(this.getKey(key));
      
      this.logOperation('increment', key);
      return value;
    } catch (error: unknown) {
      this.logOperation('increment', key, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.validateKey(key);
      const exists = await this.redis.exists(this.getKey(key));
      
      this.logOperation('exists', key);
      return exists === 1;
    } catch (error: unknown) {
      this.logOperation('exists', key, error);
      throw error;
    }
  }
} 