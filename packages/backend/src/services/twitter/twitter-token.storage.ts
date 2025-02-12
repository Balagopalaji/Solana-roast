import { SecureStorage } from '../storage/secure.storage';
import { StorageConfig } from '../storage/base-storage.service';
import logger from '../../utils/logger';

export interface TwitterTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  userId: string;
  username: string;
  codeVerifier?: string;
  createdAt?: number;
}

export class TwitterTokenStorage extends SecureStorage<TwitterTokenData> {
  constructor(config: StorageConfig = {}) {
    super({
      ...config,
      prefix: 'twitter:tokens'
    });
    logger.info('TwitterTokenStorage initialized');
  }

  async storeUserTokens(userId: string, tokens: TwitterTokenData): Promise<void> {
    try {
      // Add timestamp if not provided
      if (!tokens.expiresAt && tokens.accessToken) {
        // Default to 2 hours from now if not specified
        tokens.expiresAt = Date.now() + (2 * 60 * 60 * 1000);
      }

      // Store with user ID as key
      await this.set(userId, tokens);

      logger.info('Twitter tokens stored successfully', {
        userId,
        username: tokens.username,
        hasRefreshToken: !!tokens.refreshToken,
        expiresAt: new Date(tokens.expiresAt || 0).toISOString()
      });
    } catch (error) {
      logger.error('Failed to store Twitter tokens:', error);
      throw new Error('Failed to store Twitter tokens');
    }
  }

  async getUserTokens(userId: string): Promise<TwitterTokenData | null> {
    try {
      const tokens = await this.get(userId);
      
      if (!tokens) {
        logger.debug('No Twitter tokens found for user', { userId });
        return null;
      }

      // Check if tokens are expired
      if (tokens.expiresAt && Date.now() > tokens.expiresAt) {
        logger.debug('Twitter tokens expired', { 
          userId,
          username: tokens.username,
          expiredAt: new Date(tokens.expiresAt).toISOString()
        });
        return null;
      }

      logger.debug('Twitter tokens retrieved successfully', {
        userId,
        username: tokens.username,
        hasRefreshToken: !!tokens.refreshToken,
        expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt).toISOString() : 'never'
      });

      return tokens;
    } catch (error) {
      logger.error('Failed to retrieve Twitter tokens:', error);
      throw new Error('Failed to retrieve Twitter tokens');
    }
  }

  async removeUserTokens(userId: string): Promise<void> {
    try {
      await this.delete(userId);
      logger.info('Twitter tokens removed successfully', { userId });
    } catch (error) {
      logger.error('Failed to remove Twitter tokens:', error);
      throw new Error('Failed to remove Twitter tokens');
    }
  }

  async updateTokenExpiry(userId: string, expiresAt: number): Promise<void> {
    try {
      const tokens = await this.getUserTokens(userId);
      if (!tokens) {
        throw new Error('No tokens found to update expiry');
      }

      tokens.expiresAt = expiresAt;
      await this.storeUserTokens(userId, tokens);
      
      logger.debug('Token expiry updated successfully', {
        userId,
        username: tokens.username,
        newExpiryDate: new Date(expiresAt).toISOString()
      });
    } catch (error) {
      logger.error('Failed to update token expiry:', error);
      throw new Error('Failed to update token expiry');
    }
  }

  async listValidTokens(): Promise<TwitterTokenData[]> {
    try {
      const allTokens = await this.list('*');
      const now = Date.now();

      // Filter out expired tokens
      const validTokens = allTokens.filter(tokens => 
        !tokens.expiresAt || tokens.expiresAt > now
      );

      logger.debug('Retrieved valid Twitter tokens', {
        totalTokens: allTokens.length,
        validTokens: validTokens.length,
        expiredTokens: allTokens.length - validTokens.length
      });

      return validTokens;
    } catch (error) {
      logger.error('Failed to list valid Twitter tokens:', error);
      throw new Error('Failed to list valid Twitter tokens');
    }
  }
} 