import { Redis } from 'ioredis';
import { getTwitterRateLimiter, resetTwitterRateLimiter } from '../twitter-rate-limiter.factory';
import { TwitterRateLimiter } from '../twitter-rate-limiter';

// Mock Redis
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

describe('TwitterRateLimiter Factory', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    // Reset the singleton instance
    resetTwitterRateLimiter();
    // Reset environment variables
    process.env.REDIS_URL = 'redis://localhost:6379';
  });

  it('should create a new instance when first called', () => {
    const limiter = getTwitterRateLimiter();
    expect(limiter).toBeInstanceOf(TwitterRateLimiter);
    expect(MockedRedis).toHaveBeenCalledTimes(1);
  });

  it('should reuse the same instance on subsequent calls', () => {
    const limiter1 = getTwitterRateLimiter();
    const limiter2 = getTwitterRateLimiter();
    
    expect(limiter1).toBe(limiter2);
    expect(MockedRedis).toHaveBeenCalledTimes(1);
  });

  it('should create a new instance after reset', () => {
    const limiter1 = getTwitterRateLimiter();
    resetTwitterRateLimiter();
    const limiter2 = getTwitterRateLimiter();
    
    expect(limiter1).not.toBe(limiter2);
    expect(MockedRedis).toHaveBeenCalledTimes(2);
  });

  it('should throw error when REDIS_URL is not set', () => {
    delete process.env.REDIS_URL;
    
    expect(() => getTwitterRateLimiter())
      .toThrow('REDIS_URL environment variable is not set');
  });

  it('should throw error when Redis connection fails', () => {
    MockedRedis.mockImplementation(() => {
      throw new Error('Connection failed');
    });
    
    expect(() => getTwitterRateLimiter())
      .toThrow('Failed to initialize TwitterRateLimiter');
  });
}); 