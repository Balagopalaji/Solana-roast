import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { RedisMetrics } from '../../types/redis.types';
import logger from '../../utils/logger';
import { environment } from '../../config/environment';

export class RedisService extends EventEmitter {
  private static instance: RedisService;
  private client: Redis;
  private metrics: RedisMetrics = {
    isConnected: false,
    memoryUsage: 0,
    operationLatency: 0,
    errorRate: 0,
    lastUpdate: Date.now()
  };

  private constructor() {
    super();
    this.client = new Redis({
      host: environment.redis.host,
      port: environment.redis.port,
      password: environment.redis.password,
      tls: environment.redis.tls ? {} : undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.setupEventHandlers();
    this.startMetricsCollection();
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public getMetrics(): RedisMetrics {
    return { ...this.metrics };
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis connected');
      this.metrics.isConnected = true;
      this.emit('metrics', this.metrics);
    });

    this.client.on('error', (error) => {
      logger.error('Redis error:', error);
      this.metrics.isConnected = false;
      this.metrics.errorRate = (this.metrics.errorRate || 0) + 1;
      this.emit('metrics', this.metrics);
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
      this.metrics.isConnected = false;
      this.emit('metrics', this.metrics);
    });
  }

  private startMetricsCollection(): void {
    // Collect metrics every 10 seconds
    setInterval(async () => {
      try {
        const start = Date.now();
        
        // Ping to check latency
        await this.client.ping();
        const latency = Date.now() - start;
        
        // Get memory info
        const info = await this.client.info('memory');
        const usedMemory = parseInt(info.match(/used_memory:(\d+)/)?.[1] || '0', 10);
        const maxMemory = parseInt(info.match(/maxmemory:(\d+)/)?.[1] || '0', 10);
        
        // Update metrics
        this.metrics = {
          ...this.metrics,
          operationLatency: latency,
          memoryUsage: maxMemory ? usedMemory / maxMemory : 0,
          lastUpdate: Date.now()
        };

        this.emit('metrics', this.metrics);
      } catch (error) {
        logger.error('Failed to collect Redis metrics:', error);
      }
    }, 10000);

    // Reset error rate every minute
    setInterval(() => {
      this.metrics.errorRate = 0;
    }, 60000);
  }

  // Redis operations
  public async get(key: string): Promise<any> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      this.metrics.errorRate = (this.metrics.errorRate || 0) + 1;
      throw error;
    }
  }

  public async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.set(key, serialized, 'EX', ttl);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      logger.error('Redis set error:', error);
      this.metrics.errorRate = (this.metrics.errorRate || 0) + 1;
      throw error;
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis delete error:', error);
      this.metrics.errorRate = (this.metrics.errorRate || 0) + 1;
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      this.metrics.errorRate = (this.metrics.errorRate || 0) + 1;
      throw error;
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Redis keys error:', error);
      this.metrics.errorRate = (this.metrics.errorRate || 0) + 1;
      throw error;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Redis ttl error:', error);
      this.metrics.errorRate = (this.metrics.errorRate || 0) + 1;
      throw error;
    }
  }

  public async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      logger.error('Redis expire error:', error);
      this.metrics.errorRate = (this.metrics.errorRate || 0) + 1;
      throw error;
    }
  }

  public async quit(): Promise<void> {
    await this.client.quit();
  }
} 