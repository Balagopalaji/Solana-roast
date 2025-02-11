import { TwitterApi } from 'twitter-api-v2';
import { TwitterTokenStorage, TwitterTokenData } from './twitter-token.storage';
import { EventBusService } from '../events/event-bus.service';
import { EventType, TwitterAuthEvent } from '../events/events.types';
import logger from '../../utils/logger';

export interface TwitterSession {
  userId: string;
  username: string;
  client: TwitterApi;
  expiresAt?: number;
}

export interface TwitterSessionConfig {
  tokenStorage: TwitterTokenStorage;
  eventBus?: EventBusService;
}

export class TwitterSessionManager {
  private sessions: Map<string, TwitterSession>;
  private tokenStorage: TwitterTokenStorage;
  private eventBus?: EventBusService;
  private readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

  constructor(config: TwitterSessionConfig) {
    this.sessions = new Map();
    this.tokenStorage = config.tokenStorage;
    this.eventBus = config.eventBus;
    
    logger.info('TwitterSessionManager initialized');
  }

  async createSession(tokens: TwitterTokenData): Promise<TwitterSession> {
    try {
      // Store tokens first
      await this.tokenStorage.storeUserTokens(tokens.userId, tokens);

      // Create Twitter client
      const client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY!,
        appSecret: process.env.TWITTER_API_SECRET!,
        accessToken: tokens.accessToken,
        accessSecret: tokens.refreshToken || ''
      });

      // Create session
      const session: TwitterSession = {
        userId: tokens.userId,
        username: tokens.username,
        client,
        expiresAt: tokens.expiresAt
      };

      // Store session
      this.sessions.set(tokens.userId, session);

      logger.info('Twitter session created', {
        userId: tokens.userId,
        username: tokens.username,
        expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt).toISOString() : 'never'
      });

      return session;
    } catch (error) {
      logger.error('Failed to create Twitter session:', error);
      throw new Error('Failed to create Twitter session');
    }
  }

  async getSession(userId: string): Promise<TwitterSession | null> {
    try {
      // Check memory cache first
      let session = this.sessions.get(userId);

      // If not in memory, try to restore from storage
      if (!session) {
        const tokens = await this.tokenStorage.getUserTokens(userId);
        if (tokens) {
          session = await this.createSession(tokens);
        }
      }

      // If no session found
      if (!session) {
        logger.debug('No Twitter session found', { userId });
        return null;
      }

      // Check if session needs refresh
      if (await this.shouldRefreshSession(session)) {
        session = await this.refreshSession(session);
      }

      return session;
    } catch (error) {
      logger.error('Failed to get Twitter session:', error);
      throw new Error('Failed to get Twitter session');
    }
  }

  async removeSession(userId: string): Promise<void> {
    try {
      // Remove from memory
      this.sessions.delete(userId);
      // Remove from storage
      await this.tokenStorage.removeUserTokens(userId);

      logger.info('Twitter session removed', { userId });
    } catch (error) {
      logger.error('Failed to remove Twitter session:', error);
      throw new Error('Failed to remove Twitter session');
    }
  }

  private async shouldRefreshSession(session: TwitterSession): Promise<boolean> {
    if (!session.expiresAt) return false;
    
    const timeUntilExpiry = session.expiresAt - Date.now();
    return timeUntilExpiry < this.REFRESH_THRESHOLD;
  }

  private async refreshSession(session: TwitterSession): Promise<TwitterSession> {
    try {
      // Get stored tokens
      const tokens = await this.tokenStorage.getUserTokens(session.userId);
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      // Create OAuth2 client for refresh
      const oauth2Client = new TwitterApi({
        clientId: process.env.TWITTER_CLIENT_ID!,
        clientSecret: process.env.TWITTER_CLIENT_SECRET!
      });

      // Attempt to refresh using the OAuth2 client
      const { accessToken, refreshToken: newRefreshToken } = await oauth2Client.refreshOAuth2Token(tokens.refreshToken);

      // Update tokens
      const updatedTokens: TwitterTokenData = {
        ...tokens,
        accessToken,
        refreshToken: newRefreshToken,
        expiresAt: Date.now() + (3600 * 1000) // 1 hour default
      };

      // Store updated tokens
      await this.tokenStorage.storeUserTokens(session.userId, updatedTokens);

      // Create new session
      const newSession = await this.createSession(updatedTokens);

      // Emit refresh event
      if (this.eventBus) {
        const event: TwitterAuthEvent = {
          type: EventType.TWITTER_AUTH_COMPLETED,
          payload: {
            userId: session.userId,
            timestamp: Date.now()
          },
          source: 'twitter_session_manager',
          timestamp: Date.now()
        };
        await this.eventBus.publishEvent(event);
      }

      logger.info('Twitter session refreshed', {
        userId: session.userId,
        username: session.username,
        newExpiryDate: new Date(updatedTokens.expiresAt!).toISOString()
      });

      return newSession;
    } catch (error) {
      logger.error('Failed to refresh Twitter session:', error);
      
      // Remove invalid session
      await this.removeSession(session.userId);
      
      // Emit refresh failed event
      if (this.eventBus) {
        const event: TwitterAuthEvent = {
          type: EventType.TWITTER_AUTH_FAILED,
          payload: {
            userId: session.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now()
          },
          source: 'twitter_session_manager',
          timestamp: Date.now()
        };
        await this.eventBus.publishEvent(event);
      }

      throw new Error('Failed to refresh Twitter session');
    }
  }

  async validateSession(userId: string): Promise<boolean> {
    try {
      const session = await this.getSession(userId);
      if (!session) return false;

      // Try to verify credentials
      const result = await session.client.v1.verifyCredentials();
      
      logger.debug('Twitter session validated', {
        userId,
        username: result.screen_name,
        verified: result.verified
      });

      return true;
    } catch (error) {
      logger.error('Twitter session validation failed:', error);
      return false;
    }
  }

  async listActiveSessions(): Promise<TwitterSession[]> {
    try {
      const validTokens = await this.tokenStorage.listValidTokens();
      const sessions: TwitterSession[] = [];

      for (const tokens of validTokens) {
        try {
          const session = await this.getSession(tokens.userId);
          if (session) {
            sessions.push(session);
          }
        } catch (error) {
          logger.warn('Failed to restore session for user', {
            userId: tokens.userId,
            error
          });
          // Continue with other sessions
          continue;
        }
      }

      logger.debug('Retrieved active Twitter sessions', {
        totalSessions: sessions.length
      });

      return sessions;
    } catch (error) {
      logger.error('Failed to list active Twitter sessions:', error);
      throw new Error('Failed to list active Twitter sessions');
    }
  }
} 