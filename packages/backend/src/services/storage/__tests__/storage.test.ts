import { RedisStorage } from '../redis.storage';
import { SecureStorage } from '../secure.storage';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';

// Mock Redis and crypto
jest.mock('ioredis');
jest.mock('crypto');

describe('Storage Services', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    // Reset environment variables
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.ENCRYPTION_KEY = '0'.repeat(64); // 32 bytes in hex
  });

  describe('RedisStorage', () => {
    let storage: RedisStorage<any>;

    beforeEach(() => {
      storage = new RedisStorage({ prefix: 'test' });
    });

    it('should handle basic set/get operations', async () => {
      const testData = { key: 'value' };
      await storage.set('test-key', testData);
      const result = await storage.get('test-key');
      expect(result).toEqual(testData);
    });

    it('should handle TTL correctly', async () => {
      const ttlStorage = new RedisStorage({ prefix: 'test', ttl: 1 });
      await ttlStorage.set('key', { value: 'test' });
      
      let value = await ttlStorage.get('key');
      expect(value).toEqual({ value: 'test' });

      await new Promise(resolve => setTimeout(resolve, 1100));
      value = await ttlStorage.get('key');
      expect(value).toBeNull();
    });

    it('should handle list operations', async () => {
      await storage.set('key1', { value: 1 });
      await storage.set('key2', { value: 2 });

      const results = await storage.list('key*');
      expect(results).toHaveLength(2);
      expect(results).toContainEqual({ value: 1 });
      expect(results).toContainEqual({ value: 2 });
    });

    it('should handle delete operations', async () => {
      await storage.set('key', { value: 'test' });
      await storage.delete('key');
      const result = await storage.get('key');
      expect(result).toBeNull();
    });

    it('should validate keys', async () => {
      await expect(storage.set('', { value: 'test' }))
        .rejects.toThrow('Invalid key');
      await expect(storage.set(123 as any, { value: 'test' }))
        .rejects.toThrow('Invalid key');
    });

    it('should validate values', async () => {
      await expect(storage.set('key', null as any))
        .rejects.toThrow('Cannot store null');
      await expect(storage.set('key', undefined as any))
        .rejects.toThrow('Cannot store null');
    });
  });

  describe('SecureStorage', () => {
    let storage: SecureStorage<any>;

    beforeEach(() => {
      storage = new SecureStorage({ prefix: 'test' });
    });

    it('should encrypt and decrypt data correctly', async () => {
      const testData = { sensitive: 'test' };
      await storage.set('key', testData);

      // Get the raw Redis data to verify it's encrypted
      const redisStorage = new RedisStorage({ prefix: 'secure:test' });
      const encrypted = await redisStorage.get('key');
      expect(encrypted).not.toEqual(JSON.stringify(testData));
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('data');

      // Verify decryption works
      const decrypted = await storage.get('key');
      expect(decrypted).toEqual(testData);
    });

    it('should handle key rotation', async () => {
      // Store some data with the original key
      const testData = { sensitive: 'test' };
      await storage.set('key', testData);

      // Rotate to a new key
      const newKey = '1'.repeat(64);
      await storage.rotateKey(newKey);

      // Verify data is still accessible
      const result = await storage.get('key');
      expect(result).toEqual(testData);
    });

    it('should handle invalid encryption keys', async () => {
      // Test invalid key length
      const invalidKey = '1'.repeat(62); // Not 64 chars
      await expect(storage.rotateKey(invalidKey))
        .rejects.toThrow('must be 64 characters');

      // Test missing environment variable
      delete process.env.ENCRYPTION_KEY;
      await expect(() => new SecureStorage({ prefix: 'test' }))
        .toThrow('ENCRYPTION_KEY environment variable is not set');
    });

    it('should handle list operations with encryption', async () => {
      const items = [
        { id: 1, sensitive: 'test1' },
        { id: 2, sensitive: 'test2' }
      ];

      await Promise.all(
        items.map(item => storage.set(`key${item.id}`, item))
      );

      const results = await storage.list('key*');
      expect(results).toHaveLength(2);
      expect(results).toContainEqual(items[0]);
      expect(results).toContainEqual(items[1]);
    });

    it('should handle errors during encryption/decryption', async () => {
      // Mock crypto functions
      const mockCipher = {
        update: jest.fn().mockReturnValue('encrypted'),
        final: jest.fn().mockReturnValue('final'),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag'))
      };

      const mockDecipher = {
        update: jest.fn().mockReturnValue('decrypted'),
        final: jest.fn().mockReturnValue('final'),
        setAuthTag: jest.fn()
      };

      // Mock crypto functions
      (crypto.createCipheriv as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Encryption failed');
      });

      await expect(storage.set('key', { value: 'test' }))
        .rejects.toThrow('Encryption failed');

      // Simulate decryption error by corrupting data
      const redisStorage = new RedisStorage({ prefix: 'secure:test' });
      await redisStorage.set('key', {
        iv: 'invalid',
        data: 'corrupted:data'
      });

      await expect(storage.get('key'))
        .rejects.toThrow('Decryption failed');
    });
  });
}); 