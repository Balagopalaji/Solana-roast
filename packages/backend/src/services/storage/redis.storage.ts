import { Redis } from 'ioredis';
import { BaseStorageService, StorageConfig } from './base-storage.service';
import { RedisService } from './redis.service';
import logger from '../../utils/logger';

export class RedisStorage<T> extends BaseStorageService<T> {
  private redisService: RedisService;
  protected prefix: string;
  protected ttl?: number;
  private initialized: boolean = false;

  constructor(config: StorageConfig = {}) {
    super(config);
    this.prefix = config.prefix || '';
    this.ttl = config.ttl;

    // Get Redis service instance
    this.redisService = RedisService.getInstance();
    this.initialized = true;
    logger.info('RedisStorage initialized', { prefix: this.prefix });
  }

  protected getKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  protected async validateKey(key: string): Promise<boolean> {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key');
    }
    return true;
  }

  protected async validateValue(value: T): Promise<boolean> {
    if (value === undefined || value === null) {
      throw new Error('Invalid value');
    }
    return true;
  }

  protected logOperation(operation: string, key: string, error?: unknown): void {
    if (error) {
      logger.error(`Redis ${operation} operation failed`, {
        prefix: this.prefix,
        key,
        error
      });
    } else {
      logger.debug(`Redis ${operation} operation completed`, {
        prefix: this.prefix,
        key
      });
    }
  }

  async get(key: string): Promise<T | null> {
    try {
      if (!this.initialized) {
        throw new Error('Redis storage not initialized');
      }
      await this.validateKey(key);
      const data = await this.redisService.get(this.getKey(key));
      
      if (!data) {
        this.logOperation('get', key);
        return null;
      }

      const parsed = data as T;
      this.logOperation('get', key);
      return parsed;
    } catch (error: unknown) {
      this.logOperation('get', key, error);
      throw error;
    }
  }

  async set(key: string, value: T): Promise<void> {
    try {
      if (!this.initialized) {
        throw new Error('Redis storage not initialized');
      }
      await this.validateKey(key);
      await this.validateValue(value);

      const fullKey = this.getKey(key);
      await this.redisService.set(fullKey, value, this.ttl);

      this.logOperation('set', key);
    } catch (error: unknown) {
      this.logOperation('set', key, error);
      throw error;
    }
  }

  async setWithExpiry(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      if (!this.initialized) {
        throw new Error('Redis storage not initialized');
      }
      await this.validateKey(key);
      await this.validateValue(value);

      const fullKey = this.getKey(key);
      const serializedValue = JSON.stringify(value);
      await this.redisService.set(fullKey, serializedValue);
      await this.redisService.expire(fullKey, ttlSeconds);
      
      this.logOperation('setWithExpiry', key);
    } catch (error: unknown) {
      this.logOperation('setWithExpiry', key, error);
      throw error;
    }
  }

  async getTimeToLive(key: string): Promise<number | null> {
    try {
      if (!this.initialized) {
        throw new Error('Redis storage not initialized');
      }
      await this.validateKey(key);
      const fullKey = this.getKey(key);
      const ttl = await this.redisService.ttl(fullKey);
      
      this.logOperation('getTimeToLive', key);
      return ttl;
    } catch (error: unknown) {
      this.logOperation('getTimeToLive', key, error);
      throw error;
    }
  }

  async list(pattern: string): Promise<T[]> {
    try {
      if (!this.initialized) {
        throw new Error('Redis storage not initialized');
      }

      const fullPattern = this.getKey(pattern);
      const keys = await this.redisService.keys(fullPattern);
      
      if (keys.length === 0) {
        this.logOperation('list', pattern);
        return [];
      }

      const values = await Promise.all(
        keys.map((key: string) => this.redisService.get(key))
      );

      const parsed = values
        .filter((value: unknown): value is T => value !== null)
        .map((value: T) => value);

      this.logOperation('list', pattern);
      return parsed;
    } catch (error: unknown) {
      this.logOperation('list', pattern, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (!this.initialized) {
        throw new Error('Redis storage not initialized');
      }
      await this.validateKey(key);
      await this.redisService.delete(this.getKey(key));
      this.logOperation('delete', key);
    } catch (error: unknown) {
      this.logOperation('delete', key, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.initialized) {
        throw new Error('Redis storage not initialized');
      }
      await this.validateKey(key);
      const fullKey = this.getKey(key);
      return await this.redisService.exists(fullKey);
    } catch (error: unknown) {
      this.logOperation('exists', key, error);
      throw error;
    }
  }
} 