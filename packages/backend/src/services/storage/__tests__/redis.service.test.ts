import { Redis } from 'ioredis';
import { RedisService } from '../redis.service';
import logger from '../../../utils/logger';

// Mock Redis and logger
jest.mock('ioredis');
jest.mock('../../../utils/logger');

const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

describe('RedisService', () => {
  let redisService: RedisService;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    // Reset environment variables
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.NODE_ENV = 'development';
    // Get fresh instance
    redisService = RedisService.getInstance();
  });

  afterEach(async () => {
    await redisService.closeAll();
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = RedisService.getInstance();
      const instance2 = RedisService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getClient', () => {
    it('should create a new client with default config', async () => {
      const client = await redisService.getClient();
      expect(client).toBeInstanceOf(Redis);
      expect(MockedRedis).toHaveBeenCalledWith(
        'redis://localhost:6379',
        expect.objectContaining({
          enableOfflineQueue: true,
          enableReadyCheck: true,
          lazyConnect: true
        })
      );
    });

    it('should reuse existing client with same name', async () => {
      const client1 = await redisService.getClient('test');
      const client2 = await redisService.getClient('test');
      expect(client1).toBe(client2);
      expect(MockedRedis).toHaveBeenCalledTimes(1);
    });

    it('should handle connection errors', async () => {
      MockedRedis.mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });

      await expect(redisService.getClient())
        .rejects
        .toThrow('Connection failed');
    });

    it('should configure TLS in production', async () => {
      process.env.NODE_ENV = 'production';
      await redisService.getClient();
      
      expect(MockedRedis).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tls: { rejectUnauthorized: true }
        })
      );
    });
  });

  describe('metrics', () => {
    it('should track connection status', async () => {
      const client = await redisService.getClient();
      
      // Simulate connection events
      client.emit('connect');
      expect(redisService.getMetrics().connectionStatus).toBe('connected');

      client.emit('error', new Error('Test error'));
      expect(redisService.getMetrics().connectionStatus).toBe('error');

      client.emit('close');
      expect(redisService.getMetrics().connectionStatus).toBe('disconnected');
    });

    it('should track operations and errors', async () => {
      const client = await redisService.getClient();
      
      // Simulate some operations
      await client.ping();
      await client.ping();
      
      const metrics = redisService.getMetrics();
      expect(metrics.totalOperations).toBeGreaterThan(0);
      expect(metrics.failedOperations).toBe(0);
    });
  });

  describe('closeAll', () => {
    it('should close all clients', async () => {
      const client1 = await redisService.getClient('client1');
      const client2 = await redisService.getClient('client2');

      await redisService.closeAll();

      expect(client1.quit).toHaveBeenCalled();
      expect(client2.quit).toHaveBeenCalled();
    });

    it('should handle errors during close', async () => {
      const client = await redisService.getClient();
      jest.spyOn(client, 'quit').mockRejectedValueOnce(new Error('Close failed'));

      await redisService.closeAll();
      expect(logger.error).toHaveBeenCalledWith(
        'Error closing Redis client',
        expect.objectContaining({
          error: expect.any(Error)
        })
      );
    });
  });
}); 