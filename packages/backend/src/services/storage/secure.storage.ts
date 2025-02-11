import { BaseStorageService, StorageConfig } from './base-storage.service';
import { RedisStorage } from './redis.storage';
import logger from '../../utils/logger';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

interface EncryptedData {
  iv: string;
  data: string;
}

export class SecureStorage<T> extends BaseStorageService<T> {
  private readonly algorithm = 'aes-256-gcm';
  private encryptionKey: Buffer;
  private storage: RedisStorage<EncryptedData>;

  constructor(config: StorageConfig = {}) {
    super(config);
    
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Convert hex string to buffer
    this.encryptionKey = Buffer.from(key, 'hex');
    if (this.encryptionKey.length !== 32) { // 256 bits
      throw new Error('ENCRYPTION_KEY must be 64 characters (32 bytes) long');
    }

    // Initialize storage with secure prefix
    this.storage = new RedisStorage<EncryptedData>({
      ...config,
      prefix: `secure:${config.prefix || ''}`
    });

    logger.info('SecureStorage initialized', { prefix: this.prefix });
  }

  async set(key: string, value: T): Promise<void> {
    const encrypted = await this.encrypt(JSON.stringify(value));
    await this.storage.set(key, encrypted);
  }

  async get(key: string): Promise<T | null> {
    const encrypted = await this.storage.get(key);
    if (!encrypted) return null;

    const decrypted = await this.decrypt(encrypted);
    return JSON.parse(decrypted) as T;
  }

  async list(pattern: string): Promise<T[]> {
    const encryptedItems = await this.storage.list(pattern);
    return Promise.all(
      encryptedItems.map(async (item) => {
        const decrypted = await this.decrypt(item);
        return JSON.parse(decrypted) as T;
      })
    );
  }

  async delete(key: string): Promise<void> {
    await this.storage.delete(key);
  }

  private async encrypt(text: string): Promise<EncryptedData> {
    try {
      // Generate initialization vector
      const iv = randomBytes(16);
      
      // Create cipher
      const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);
      
      // Encrypt the data
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine encrypted data with auth tag
      const finalData = encrypted + ':' + authTag.toString('hex');

      return {
        iv: iv.toString('hex'),
        data: finalData
      };
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  private async decrypt(encrypted: EncryptedData): Promise<string> {
    try {
      const iv = Buffer.from(encrypted.iv, 'hex');
      const [encryptedText, authTag] = encrypted.data.split(':');
      
      // Create decipher
      const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      // Decrypt the data
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  async setWithExpiry(key: string, value: T, ttlSeconds: number): Promise<void> {
    const encrypted = await this.encrypt(JSON.stringify(value));
    await this.storage.setWithExpiry(key, encrypted, ttlSeconds);
  }

  async getTimeToLive(key: string): Promise<number | null> {
    return this.storage.getTimeToLive(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.storage.exists(key);
  }

  // Helper method to rotate encryption keys
  async rotateKey(newKey: string): Promise<void> {
    if (Buffer.from(newKey, 'hex').length !== 32) {
      throw new Error('New encryption key must be 64 characters (32 bytes) long');
    }

    // Get all current data
    const keys = await this.storage.list('*');
    const oldKey = this.encryptionKey;
    
    try {
      // Update encryption key
      this.encryptionKey = Buffer.from(newKey, 'hex');

      // Re-encrypt all data with new key
      for (const encrypted of keys) {
        // Decrypt with old key
        const decrypted = await this.decrypt(encrypted);
        const value = JSON.parse(decrypted) as T;
        
        // Re-encrypt with new key
        const newEncrypted = await this.encrypt(JSON.stringify(value));
        await this.storage.set(encrypted.iv, newEncrypted); // Use IV as key since it's unique
      }

      logger.info('Encryption key rotated successfully');
    } catch (error) {
      // Restore old key if anything fails
      this.encryptionKey = oldKey;
      throw error;
    }
  }
} 