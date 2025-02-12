/// <reference types="jest" />

import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { Redis } from 'ioredis';
import { RedisService } from '../redis.service';
import { RedisMetrics } from '../../../types/redis.types';
import logger from '../../../utils/logger';
import { environment } from '../../../config/environment';
import { mockRedisClient, createMockRedisClient } from '../../../tests/mocks/ioredis';

// Mock dependencies
jest.mock('ioredis');
jest.mock('../../../utils/logger');
jest.mock('../../../config/environment', () => ({
  environment: {
    redis: {
      host: 'localhost',
      port: 6379,
      password: undefined,
      tls: false
    }
  }
}));

describe('RedisService', () => {
  let redisService: RedisService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get a fresh instance
    redisService = RedisService.getInstance();
  });

  afterEach(async () => {
    await redisService.quit();
    // Clear singleton instance
    (RedisService as any).instance = undefined;
    // Clear intervals
    jest.clearAllTimers();
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = RedisService.getInstance();
      const instance2 = RedisService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with correct configuration', () => {
      expect(Redis).toHaveBeenCalledWith({
        host: environment.redis.host,
        port: environment.redis.port,
        password: environment.redis.password,
        tls: undefined,
        retryStrategy: expect.any(Function)
      });
    });
  });

  describe('event handling', () => {
    it('should setup event handlers on initialization', () => {
      expect(mockRedisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should update metrics on connect event', () => {
      const connectHandler = (mockRedisClient.on as jest.Mock).mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];

      if (connectHandler) {
        connectHandler();
        const metrics = redisService.getMetrics();
        expect(metrics.isConnected).toBe(true);
      }
    });

    it('should update metrics on error event', () => {
      const errorHandler = (mockRedisClient.on as jest.Mock).mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      if (errorHandler) {
        errorHandler(new Error('test error'));
        const metrics = redisService.getMetrics();
        expect(metrics.isConnected).toBe(false);
        expect(metrics.errorRate).toBe(1);
      }
    });

    it('should update metrics on close event', () => {
      const closeHandler = (mockRedisClient.on as jest.Mock).mock.calls.find(
        call => call[0] === 'close'
      )?.[1];

      if (closeHandler) {
        closeHandler();
        const metrics = redisService.getMetrics();
        expect(metrics.isConnected).toBe(false);
      }
    });
  });

  describe('metrics collection', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should collect metrics periodically', async () => {
      // Fast-forward 10 seconds
      jest.advanceTimersByTime(10000);

      // Let any pending promises resolve
      await Promise.resolve();

      expect(mockRedisClient.ping).toHaveBeenCalled();
      expect(mockRedisClient.info).toHaveBeenCalledWith('memory');
    });

    it('should reset error rate periodically', () => {
      // Simulate some errors
      const errorHandler = (mockRedisClient.on as jest.Mock).mock.calls.find(
        call => call[0] === 'error'
      )?.[1];
      if (errorHandler) {
        errorHandler(new Error('test error'));
        expect(redisService.getMetrics().errorRate).toBe(1);
      }

      // Fast-forward 1 minute
      jest.advanceTimersByTime(60000);

      expect(redisService.getMetrics().errorRate).toBe(0);
    });
  });

  describe('Redis operations', () => {
    it('should handle get operation', async () => {
      const testValue = { test: 'value' };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(testValue));

      const result = await redisService.get('test-key');
      expect(result).toEqual(testValue);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should handle set operation with TTL', async () => {
      const testValue = { test: 'value' };
      const ttl = 3600;

      await redisService.set('test-key', testValue, ttl);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testValue),
        'EX',
        ttl
      );
    });

    it('should handle delete operation', async () => {
      await redisService.delete('test-key');
      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle exists operation', async () => {
      mockRedisClient.exists.mockResolvedValueOnce(1);
      const result = await redisService.exists('test-key');
      expect(result).toBe(true);
    });

    it('should handle set operation without TTL', async () => {
      const testValue = { test: 'value' };
      await redisService.set('test-key', testValue);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testValue)
      );
    });
  });

  describe('leaderboard operations', () => {
    it('should handle sorted set operations', async () => {
      const key = 'roast:leaderboard';
      const score = 100;
      const member = 'wallet123';

      await redisService.zadd(key, score, member);
      expect(mockRedisClient.zadd).toHaveBeenCalledWith(key, score, member);

      const topWallets = await redisService.zrevrange(key, 0, 9);
      expect(mockRedisClient.zrevrange).toHaveBeenCalledWith(key, 0, 9);
      expect(topWallets).toHaveLength(2);

      const walletScore = await redisService.zscore(key, member);
      expect(mockRedisClient.zscore).toHaveBeenCalledWith(key, member);
      expect(Number(walletScore)).toBe(100);

      const totalWallets = await redisService.zcard(key);
      expect(mockRedisClient.zcard).toHaveBeenCalledWith(key);
      expect(totalWallets).toBe(2);
    });
  });

  describe('analytics operations', () => {
    it('should handle hash operations', async () => {
      const key = 'analytics:daily:2024-01-01';
      
      await redisService.hincrby(key, 'roasts', 1);
      expect(mockRedisClient.hincrby).toHaveBeenCalledWith(key, 'roasts', 1);

      const stats = await redisService.hgetall(key);
      expect(mockRedisClient.hgetall).toHaveBeenCalledWith(key);
      expect(stats).toEqual({
        field1: 'value1',
        field2: 'value2'
      });
    });

    it('should handle multi operations', async () => {
      const multi = redisService.multi();
      expect(mockRedisClient.multi).toHaveBeenCalled();
      expect(multi).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle Redis operation errors', async () => {
      const error = new Error('Redis operation failed');
      mockRedisClient.get.mockRejectedValueOnce(error);

      await expect(redisService.get('test-key')).rejects.toThrow('Redis operation failed');
      expect(redisService.getMetrics().errorRate).toBe(1);
      expect(logger.error).toHaveBeenCalledWith('Redis get error:', error);
    });

    it('should handle invalid JSON in get operation', async () => {
      mockRedisClient.get.mockResolvedValueOnce('invalid-json');

      await expect(redisService.get('test-key')).rejects.toThrow();
      expect(redisService.getMetrics().errorRate).toBe(1);
    });
  });
}); 