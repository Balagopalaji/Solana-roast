import { TwitterTokenStorage, TwitterTokenData } from '../twitter-token.storage';

// Mock Redis and crypto
jest.mock('ioredis');
jest.mock('crypto');

describe('TwitterTokenStorage', () => {
  let storage: TwitterTokenStorage;
  const mockTokens: TwitterTokenData = {
    userId: 'user123',
    username: 'testuser',
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() + 3600000 // 1 hour from now
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    // Reset environment variables
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.ENCRYPTION_KEY = '0'.repeat(64); // 32 bytes in hex
    // Initialize storage
    storage = new TwitterTokenStorage();
  });

  describe('storeUserTokens', () => {
    it('should store tokens successfully', async () => {
      await expect(storage.storeUserTokens(mockTokens.userId, mockTokens))
        .resolves.not.toThrow();
    });

    it('should add expiry if not provided', async () => {
      const tokensWithoutExpiry = { ...mockTokens };
      delete tokensWithoutExpiry.expiresAt;

      await storage.storeUserTokens(mockTokens.userId, tokensWithoutExpiry);
      const stored = await storage.getUserTokens(mockTokens.userId);
      
      expect(stored).toBeTruthy();
      expect(stored!.expiresAt).toBeDefined();
      expect(stored!.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('getUserTokens', () => {
    it('should retrieve stored tokens', async () => {
      await storage.storeUserTokens(mockTokens.userId, mockTokens);
      const tokens = await storage.getUserTokens(mockTokens.userId);
      
      expect(tokens).toEqual(mockTokens);
    });

    it('should return null for non-existent tokens', async () => {
      const tokens = await storage.getUserTokens('nonexistent');
      expect(tokens).toBeNull();
    });

    it('should return null for expired tokens', async () => {
      const expiredTokens = {
        ...mockTokens,
        expiresAt: Date.now() - 3600000 // 1 hour ago
      };
      
      await storage.storeUserTokens(mockTokens.userId, expiredTokens);
      const tokens = await storage.getUserTokens(mockTokens.userId);
      
      expect(tokens).toBeNull();
    });
  });

  describe('removeUserTokens', () => {
    it('should remove tokens successfully', async () => {
      await storage.storeUserTokens(mockTokens.userId, mockTokens);
      await storage.removeUserTokens(mockTokens.userId);
      
      const tokens = await storage.getUserTokens(mockTokens.userId);
      expect(tokens).toBeNull();
    });

    it('should not throw when removing non-existent tokens', async () => {
      await expect(storage.removeUserTokens('nonexistent'))
        .resolves.not.toThrow();
    });
  });

  describe('updateTokenExpiry', () => {
    it('should update expiry successfully', async () => {
      await storage.storeUserTokens(mockTokens.userId, mockTokens);
      const newExpiry = Date.now() + 7200000; // 2 hours from now
      
      await storage.updateTokenExpiry(mockTokens.userId, newExpiry);
      const tokens = await storage.getUserTokens(mockTokens.userId);
      
      expect(tokens?.expiresAt).toBe(newExpiry);
    });

    it('should throw when updating non-existent tokens', async () => {
      const newExpiry = Date.now() + 7200000;
      
      await expect(storage.updateTokenExpiry('nonexistent', newExpiry))
        .rejects.toThrow('No tokens found to update expiry');
    });
  });

  describe('listValidTokens', () => {
    it('should list only valid tokens', async () => {
      const validTokens = {
        ...mockTokens,
        userId: 'valid-user',
        expiresAt: Date.now() + 3600000
      };
      
      const expiredTokens = {
        ...mockTokens,
        userId: 'expired-user',
        expiresAt: Date.now() - 3600000
      };
      
      const noExpiryTokens = {
        ...mockTokens,
        userId: 'no-expiry-user'
      };
      delete noExpiryTokens.expiresAt;

      // Store all types of tokens
      await storage.storeUserTokens(validTokens.userId, validTokens);
      await storage.storeUserTokens(expiredTokens.userId, expiredTokens);
      await storage.storeUserTokens(noExpiryTokens.userId, noExpiryTokens);

      const tokens = await storage.listValidTokens();
      
      expect(tokens).toHaveLength(2); // valid and no-expiry tokens
      expect(tokens.map(t => t.userId)).toContain(validTokens.userId);
      expect(tokens.map(t => t.userId)).toContain(noExpiryTokens.userId);
      expect(tokens.map(t => t.userId)).not.toContain(expiredTokens.userId);
    });

    it('should return empty array when no tokens exist', async () => {
      const tokens = await storage.listValidTokens();
      expect(tokens).toEqual([]);
    });
  });
}); 