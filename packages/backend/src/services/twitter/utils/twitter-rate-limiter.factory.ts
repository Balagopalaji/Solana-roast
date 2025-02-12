import { Redis } from 'ioredis';
import { TwitterRateLimiter } from './twitter-rate-limiter';
import { environment } from '../../../config/environment';
import logger from '../../../utils/logger';

let rateLimiterInstance: TwitterRateLimiter | null = null;

export function getTwitterRateLimiter(): TwitterRateLimiter {
  if (!rateLimiterInstance) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    try {
      const redisClient = new Redis(redisUrl);
      rateLimiterInstance = new TwitterRateLimiter(redisClient, environment.twitter.rateLimits);
      logger.info('TwitterRateLimiter instance created');
    } catch (error) {
      logger.error('Failed to create TwitterRateLimiter instance', { error });
      throw new Error('Failed to initialize TwitterRateLimiter');
    }
  }

  return rateLimiterInstance;
}

// For testing purposes
export function resetTwitterRateLimiter(): void {
  rateLimiterInstance = null;
} 