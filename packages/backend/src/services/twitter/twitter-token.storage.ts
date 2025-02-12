import { Redis } from 'ioredis';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { environment } from '../../config/environment';
import logger from '../../utils/logger';
import { EventBusService } from '../events/event-bus.service';
import { EventType } from '../events/events.types';

export interface TwitterTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  userId: string;
  username: string;
  scope?: string[];
  createdAt: number;
}

export interface TokenStorageConfig {
  encryptionKey?: string;
  prefix?: string;
  defaultTTL?: number;
  eventBus?: EventBusService;
}

export class TwitterTokenStorage {
  private readonly redis: Redis;
  private readonly encryptionKey: Buffer;
  private readonly prefix: string;
  private readonly defaultTTL: number;
  private readonly eventBus?: EventBusService;
  private readonly algorithm = 'aes-256-gcm';

  constructor(redis: Redis, config: TokenStorageConfig = {}) {
    this.redis = redis;
    this.prefix = config.prefix || 'twitter:tokens';
    this.defaultTTL = config.defaultTTL || 24 * 60 * 60; // 24 hours default
    this.eventBus = config.eventBus;

    // Use provided key or generate one (in production, always provide a key)
    const key = config.encryptionKey || environment.twitter.oauth2.encryptionKey;
    if (!key) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Encryption key is required in production');
      }
      logger.warn('No encryption key provided, generating a temporary one');
      this.encryptionKey = randomBytes(32);
    } else {
      this.encryptionKey = Buffer.from(key, 'hex');
    }

    logger.info('TwitterTokenStorage initialized', { prefix: this.prefix });
  }

  private getKey(userId: string): string {
    return `${this.prefix}:${userId}`;
  }

  private encrypt(data: string): { encrypted: string; iv: string; authTag: string } {
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: (cipher as any).getAuthTag().toString('hex')
    };
  }

  private decrypt(encrypted: string, iv: string, authTag: string): string {
    const decipher = createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      Buffer.from(iv, 'hex')
    );
    
    (decipher as any).setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async storeToken(userId: string, token: TwitterTokenData): Promise<void> {
    try {
      // Add timestamp if not provided
      const tokenData = {
        ...token,
        createdAt: token.createdAt || Date.now()
      };

      // Encrypt token data
      const data = JSON.stringify(tokenData);
      const { encrypted, iv, authTag } = this.encrypt(data);

      // Store encrypted data
      const key = this.getKey(userId);
      await this.redis.hset(key, {
        data: encrypted,
        iv,
        authTag,
        userId: tokenData.userId,
        username: tokenData.username,
        createdAt: tokenData.createdAt
      });

      // Set expiry if token has expiration
      if (tokenData.expiresAt) {
        const ttl = Math.floor((tokenData.expiresAt - Date.now()) / 1000);
        if (ttl > 0) {
          await this.redis.expire(key, ttl);
        }
      } else {
        await this.redis.expire(key, this.defaultTTL);
      }

      logger.debug('Token stored successfully', {
        userId,
        username: tokenData.username,
        hasRefreshToken: !!tokenData.refreshToken,
        expiresAt: tokenData.expiresAt ? new Date(tokenData.expiresAt).toISOString() : 'never'
      });

      // Emit event
      this.emitTokenEvent(EventType.TWITTER_AUTH_SUCCESS, {
        userId,
        username: tokenData.username
      });
    } catch (error) {
      logger.error('Failed to store token:', error);
      throw new Error('Failed to store token securely');
    }
  }

  async getToken(userId: string): Promise<TwitterTokenData | null> {
    try {
      const key = this.getKey(userId);
      const data = await this.redis.hgetall(key);

      if (!data || !data.data || !data.iv || !data.authTag) {
        return null;
      }

      // Decrypt token data
      const decrypted = this.decrypt(data.data, data.iv, data.authTag);
      const token = JSON.parse(decrypted) as TwitterTokenData;

      // Check if token is expired
      if (token.expiresAt && Date.now() > token.expiresAt) {
        logger.debug('Token expired', {
          userId,
          username: token.username,
          expiredAt: new Date(token.expiresAt).toISOString()
        });

        // Try to refresh if we have a refresh token
        if (token.refreshToken) {
          // We'll implement token refresh later
          logger.debug('Token refresh needed', { userId });
        }

        await this.removeToken(userId);
        return null;
      }

      return token;
    } catch (error) {
      logger.error('Failed to retrieve token:', error);
      throw new Error('Failed to retrieve token securely');
    }
  }

  async removeToken(userId: string): Promise<void> {
    try {
      const key = this.getKey(userId);
      await this.redis.del(key);
      
      logger.debug('Token removed successfully', { userId });

      // Emit event
      this.emitTokenEvent(EventType.TWITTER_AUTH_REVOKED, { userId });
    } catch (error) {
      logger.error('Failed to remove token:', error);
      throw new Error('Failed to remove token');
    }
  }

  async listValidTokens(): Promise<string[]> {
    try {
      const pattern = `${this.prefix}:*`;
      const keys = await this.redis.keys(pattern);
      const validUserIds: string[] = [];

      for (const key of keys) {
        const userId = key.split(':')[2];
        const token = await this.getToken(userId);
        if (token) {
          validUserIds.push(userId);
        }
      }

      return validUserIds;
    } catch (error) {
      logger.error('Failed to list valid tokens:', error);
      throw new Error('Failed to list valid tokens');
    }
  }

  private emitTokenEvent(
    type: EventType.TWITTER_AUTH_SUCCESS | EventType.TWITTER_AUTH_REVOKED,
    data: { userId: string; username?: string }
  ): void {
    if (this.eventBus) {
      this.eventBus.emit({
        type,
        payload: {
          ...data,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        source: 'twitter-token-storage'
      });
    }
  }
} 