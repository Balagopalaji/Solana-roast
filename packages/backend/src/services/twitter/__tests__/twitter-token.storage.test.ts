import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { Redis } from 'ioredis';
import { TwitterTokenStorage, TwitterTokenData } from '../twitter-token.storage';
import { EventBusService } from '../../events/event-bus.service';
import { EventType } from '../../events/events.types';
import { mockRedisClient } from '../../../tests/mocks/ioredis';

// Mock Redis
jest.mock('ioredis');

// Mock EventBus
const mockEventBus = {
  emit: jest.fn()
} as unknown as jest.Mocked<EventBusService>;

describe('TwitterTokenStorage', () => {
  let tokenStorage: TwitterTokenStorage;
  const testEncryptionKey = Buffer.from('0123456789abcdef0123456789abcdef').toString('hex');
  
  const mockToken: TwitterTokenData = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    userId: 'test-user-id',
    username: 'testuser',
    expiresAt: Date.now() + 3600000, // 1 hour from now
    createdAt: Date.now(),
    scope: ['tweet.read', 'tweet.write']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tokenStorage = new TwitterTokenStorage(mockRedisClient as unknown as Redis, {
      encryptionKey: testEncryptionKey,
      eventBus: mockEventBus
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('storeToken', () => {
    it('should store encrypted token data', async () => {
      await tokenStorage.storeToken(mockToken.userId, mockToken);

      expect(mockRedisClient.hset).toHaveBeenCalled();
      expect(mockRedisClient.expire).toHaveBeenCalled();
      expect(mockEventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: EventType.TWITTER_AUTH_SUCCESS
      }));
    });

    it('should handle token without expiry', async () => {
      const tokenWithoutExpiry = { ...mockToken };
      delete tokenWithoutExpiry.expiresAt;

      await tokenStorage.storeToken(mockToken.userId, tokenWithoutExpiry);

      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        expect.any(String),
        24 * 60 * 60 // Default TTL
      );
    });

    it('should throw error on storage failure', async () => {
      mockRedisClient.hset.mockRejectedValueOnce(new Error('Redis error'));

      await expect(tokenStorage.storeToken(mockToken.userId, mockToken))
        .rejects
        .toThrow('Failed to store token securely');
    });
  });

  describe('getToken', () => {
    it('should retrieve and decrypt token data', async () => {
      // First store a token
      await tokenStorage.storeToken(mockToken.userId, mockToken);

      // Mock the Redis response with encrypted data
      mockRedisClient.hgetall.mockResolvedValueOnce({
        data: expect.any(String),
        iv: expect.any(String),
        authTag: expect.any(String),
        userId: mockToken.userId,
        username: mockToken.username
      });

      const retrievedToken = await tokenStorage.getToken(mockToken.userId);
      expect(retrievedToken).toBeDefined();
      expect(retrievedToken?.userId).toBe(mockToken.userId);
      expect(retrievedToken?.accessToken).toBe(mockToken.accessToken);
    });

    it('should return null for expired token', async () => {
      const expiredToken = {
        ...mockToken,
        expiresAt: Date.now() - 3600000 // 1 hour ago
      };

      await tokenStorage.storeToken(mockToken.userId, expiredToken);
      const retrievedToken = await tokenStorage.getToken(mockToken.userId);
      
      expect(retrievedToken).toBeNull();
      expect(mockRedisClient.del).toHaveBeenCalled();
    });

    it('should return null for non-existent token', async () => {
      mockRedisClient.hgetall.mockResolvedValueOnce({});
      
      const retrievedToken = await tokenStorage.getToken('non-existent');
      expect(retrievedToken).toBeNull();
    });
  });

  describe('removeToken', () => {
    it('should remove token and emit event', async () => {
      await tokenStorage.removeToken(mockToken.userId);

      expect(mockRedisClient.del).toHaveBeenCalled();
      expect(mockEventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: EventType.TWITTER_AUTH_REVOKED
      }));
    });
  });

  describe('listValidTokens', () => {
    it('should return list of valid token user IDs', async () => {
      mockRedisClient.keys.mockResolvedValueOnce([
        'twitter:tokens:user1',
        'twitter:tokens:user2'
      ]);

      const validTokens = await tokenStorage.listValidTokens();
      expect(validTokens).toHaveLength(2);
      expect(validTokens).toContain('user1');
      expect(validTokens).toContain('user2');
    });

    it('should filter out expired tokens', async () => {
      mockRedisClient.keys.mockResolvedValueOnce([
        'twitter:tokens:user1',
        'twitter:tokens:user2'
      ]);

      // Mock user1 with valid token, user2 with expired token
      jest.spyOn(tokenStorage, 'getToken')
        .mockImplementation(async (userId) => {
          if (userId === 'user1') {
            return mockToken;
          }
          return null;
        });

      const validTokens = await tokenStorage.listValidTokens();
      expect(validTokens).toHaveLength(1);
      expect(validTokens).toContain('user1');
    });
  });

  describe('encryption', () => {
    it('should encrypt and decrypt data correctly', async () => {
      await tokenStorage.storeToken(mockToken.userId, mockToken);
      const retrievedToken = await tokenStorage.getToken(mockToken.userId);

      expect(retrievedToken).toBeDefined();
      expect(retrievedToken?.accessToken).toBe(mockToken.accessToken);
      expect(retrievedToken?.refreshToken).toBe(mockToken.refreshToken);
    });

    it('should use different IVs for each encryption', async () => {
      const spy = jest.spyOn(tokenStorage as any, 'encrypt');
      
      await tokenStorage.storeToken('user1', mockToken);
      await tokenStorage.storeToken('user2', mockToken);

      const [firstCall, secondCall] = spy.mock.results;
      expect(firstCall.value.iv).not.toBe(secondCall.value.iv);
    });
  });
}); 