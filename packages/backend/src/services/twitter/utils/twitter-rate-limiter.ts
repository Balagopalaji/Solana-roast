import { Redis } from 'ioredis';
import logger from '../../../utils/logger';

export interface RateLimitConfig {
  WINDOW_MS: number;
  UPLOAD_LIMIT: number;
  TWEET_LIMIT: number;
}

export class RateLimitExceededError extends Error {
  constructor(type: 'upload' | 'tweet') {
    super(`Rate limit exceeded for ${type} operations`);
    this.name = 'RateLimitExceededError';
  }
}

export class TwitterRateLimiter {
  constructor(
    private readonly redisClient: Redis,
    private readonly config: RateLimitConfig
  ) {
    logger.info('TwitterRateLimiter initialized', { config });
  }

  async checkRateLimit(type: 'upload' | 'tweet', userId: string): Promise<boolean> {
    try {
      const key = `twitter:${type}:${userId}`;
      const count = await this.redisClient.incr(key);
      
      if (count === 1) {
        await this.redisClient.expire(key, this.config.WINDOW_MS / 1000);
      }

      const limit = type === 'upload' ? this.config.UPLOAD_LIMIT : this.config.TWEET_LIMIT;
      if (count > limit) {
        logger.warn('Rate limit exceeded', { type, userId, count, limit });
        throw new RateLimitExceededError(type);
      }

      logger.debug('Rate limit check passed', { type, userId, count, limit });
      return true;
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        throw error;
      }
      logger.error('Error checking rate limit', { error, type, userId });
      throw new Error('Failed to check rate limit');
    }
  }

  async getRemainingLimit(type: 'upload' | 'tweet', userId: string): Promise<number> {
    try {
      const key = `twitter:${type}:${userId}`;
      const count = await this.redisClient.get(key);
      const limit = type === 'upload' ? this.config.UPLOAD_LIMIT : this.config.TWEET_LIMIT;
      
      if (!count) {
        return limit;
      }

      const remaining = Math.max(0, limit - parseInt(count, 10));
      logger.debug('Remaining rate limit', { type, userId, remaining });
      return remaining;
    } catch (error) {
      logger.error('Error getting remaining rate limit', { error, type, userId });
      throw new Error('Failed to get remaining rate limit');
    }
  }

  async resetLimits(userId: string): Promise<void> {
    try {
      const uploadKey = `twitter:upload:${userId}`;
      const tweetKey = `twitter:tweet:${userId}`;
      
      await Promise.all([
        this.redisClient.del(uploadKey),
        this.redisClient.del(tweetKey)
      ]);

      logger.info('Rate limits reset', { userId });
    } catch (error) {
      logger.error('Error resetting rate limits', { error, userId });
      throw new Error('Failed to reset rate limits');
    }
  }
} 