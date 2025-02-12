import { Redis } from 'ioredis';
import { TwitterRateLimiter, RateLimitConfig, RateLimitExceededError } from '../twitter-rate-limiter';

// Mock Redis
jest.mock('ioredis');

describe('TwitterRateLimiter', () => {
  let rateLimiter: TwitterRateLimiter;
  let mockRedis: jest.Mocked<Redis>;
  const testConfig: RateLimitConfig = {
    WINDOW_MS: 900000, // 15 minutes
    UPLOAD_LIMIT: 30,
    TWEET_LIMIT: 50
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new mock Redis instance
    mockRedis = new Redis() as jest.Mocked<Redis>;
    mockRedis.incr = jest.fn();
    mockRedis.expire = jest.fn();
    mockRedis.get = jest.fn();
    mockRedis.del = jest.fn();

    // Create a new rate limiter instance
    rateLimiter = new TwitterRateLimiter(mockRedis, testConfig);
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limits', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      const result = await rateLimiter.checkRateLimit('tweet', 'user123');
      
      expect(result).toBe(true);
      expect(mockRedis.incr).toHaveBeenCalledWith('twitter:tweet:user123');
      expect(mockRedis.expire).toHaveBeenCalledWith('twitter:tweet:user123', testConfig.WINDOW_MS / 1000);
    });

    it('should throw RateLimitExceededError when limit is exceeded', async () => {
      mockRedis.incr.mockResolvedValue(51); // Above TWEET_LIMIT

      await expect(rateLimiter.checkRateLimit('tweet', 'user123'))
        .rejects
        .toThrow(RateLimitExceededError);
    });

    it('should use different limits for upload and tweet operations', async () => {
      // Test upload limit
      mockRedis.incr.mockResolvedValue(31); // Above UPLOAD_LIMIT
      await expect(rateLimiter.checkRateLimit('upload', 'user123'))
        .rejects
        .toThrow(RateLimitExceededError);

      // Test tweet limit
      mockRedis.incr.mockResolvedValue(49); // Below TWEET_LIMIT
      const result = await rateLimiter.checkRateLimit('tweet', 'user123');
      expect(result).toBe(true);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.incr.mockRejectedValue(new Error('Redis connection error'));

      await expect(rateLimiter.checkRateLimit('tweet', 'user123'))
        .rejects
        .toThrow('Failed to check rate limit');
    });
  });

  describe('getRemainingLimit', () => {
    it('should return full limit when no requests made', async () => {
      mockRedis.get.mockResolvedValue(null);

      const remaining = await rateLimiter.getRemainingLimit('tweet', 'user123');
      expect(remaining).toBe(testConfig.TWEET_LIMIT);
    });

    it('should calculate remaining limit correctly', async () => {
      mockRedis.get.mockResolvedValue('20');

      const remaining = await rateLimiter.getRemainingLimit('tweet', 'user123');
      expect(remaining).toBe(testConfig.TWEET_LIMIT - 20);
    });

    it('should return 0 when limit is exceeded', async () => {
      mockRedis.get.mockResolvedValue('100'); // Well above limit

      const remaining = await rateLimiter.getRemainingLimit('tweet', 'user123');
      expect(remaining).toBe(0);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection error'));

      await expect(rateLimiter.getRemainingLimit('tweet', 'user123'))
        .rejects
        .toThrow('Failed to get remaining rate limit');
    });
  });

  describe('resetLimits', () => {
    it('should reset both upload and tweet limits', async () => {
      mockRedis.del.mockResolvedValue(1);

      await rateLimiter.resetLimits('user123');

      expect(mockRedis.del).toHaveBeenCalledWith('twitter:upload:user123');
      expect(mockRedis.del).toHaveBeenCalledWith('twitter:tweet:user123');
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis connection error'));

      await expect(rateLimiter.resetLimits('user123'))
        .rejects
        .toThrow('Failed to reset rate limits');
    });
  });
}); 