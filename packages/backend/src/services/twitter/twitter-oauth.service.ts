import { TwitterApi } from 'twitter-api-v2';
import { randomBytes, createHash } from 'crypto';
import { environment } from '../../config/environment';
import logger from '../../utils/logger';
import { TwitterTokenStorage, TwitterTokenData } from './twitter-token.storage';
import { EventBusService } from '../events/event-bus.service';
import { EventType, TwitterAuthEvent } from '../events/events.types';

interface PKCEData {
  codeVerifier: string;
  codeChallenge: string;
  createdAt: number;
}

interface OAuth2TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type: string;
}

interface TwitterUserResponse {
  data: {
    id: string;
    username: string;
    name: string;
  };
}

export class TwitterOAuthService {
  private static instance: TwitterOAuthService;
  private tokenStorage: TwitterTokenStorage;
  private eventBus?: EventBusService;
  private stateMap: Map<string, { createdAt: number }> = new Map();

  private readonly STATE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  private readonly PKCE_LENGTH = 64; // Length for PKCE verifier

  private constructor() {
    this.tokenStorage = new TwitterTokenStorage();
    
    // Clean up expired states periodically
    setInterval(() => this.cleanupExpiredStates(), 5 * 60 * 1000);
  }

  static getInstance(): TwitterOAuthService {
    if (!TwitterOAuthService.instance) {
      TwitterOAuthService.instance = new TwitterOAuthService();
    }
    return TwitterOAuthService.instance;
  }

  private generatePKCE(): PKCEData {
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    return {
      codeVerifier,
      codeChallenge,
      createdAt: Date.now()
    };
  }

  async generateAuthUrl(): Promise<{ url: string; state: string }> {
    const { clientId } = environment.twitter.oauth2;
    if (!clientId) {
      throw new Error('Twitter OAuth 2.0 client ID not configured');
    }

    // Generate state for CSRF protection
    const state = randomBytes(32).toString('hex');
    this.stateMap.set(state, { createdAt: Date.now() });

    // Generate PKCE
    const pkce = this.generatePKCE();
    
    // Store PKCE data
    const pkceTokenData: TwitterTokenData = {
      accessToken: '', // temporary placeholder
      userId: state, // using state as temporary ID
      username: '', // temporary placeholder
      codeVerifier: pkce.codeVerifier,
      createdAt: pkce.createdAt
    };
    await this.tokenStorage.storeUserTokens(`pkce:${state}`, pkceTokenData);

    // Construct authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: environment.twitter.urls.callback,
      scope: environment.twitter.oauth2.scopes.join(' '),
      state: state,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: 'S256'
    });

    const url = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
    return { url, state };
  }

  async handleCallback(code: string, state: string): Promise<TwitterTokenData> {
    const { clientId, clientSecret } = environment.twitter.oauth2;
    if (!clientId || !clientSecret) {
      throw new Error('Twitter OAuth 2.0 credentials not configured');
    }

    // Verify state
    if (!this.verifyState(state)) {
      throw new Error('Invalid or expired state parameter');
    }

    // Get stored PKCE data
    const pkceData = await this.tokenStorage.getUserTokens(`pkce:${state}`);
    if (!pkceData?.codeVerifier) {
      throw new Error('PKCE verifier not found or invalid');
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: environment.twitter.urls.callback,
          code_verifier: pkceData.codeVerifier
        })
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${await tokenResponse.text()}`);
      }

      const tokensResponse: unknown = await tokenResponse.json();
      const validatedTokens = this.validateTokenResponse(tokensResponse);

      // Get user information
      const userResponse = await fetch('https://api.twitter.com/2/users/me', {
        headers: {
          Authorization: `Bearer ${validatedTokens.access_token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user information');
      }

      const userDataResponse: unknown = await userResponse.json();
      const validatedUserData = this.validateUserResponse(userDataResponse);

      // Create token data
      const tokenData: TwitterTokenData = {
        accessToken: validatedTokens.access_token,
        refreshToken: validatedTokens.refresh_token,
        expiresAt: validatedTokens.expires_in ? Date.now() + validatedTokens.expires_in * 1000 : undefined,
        userId: validatedUserData.data.id,
        username: validatedUserData.data.username
      };

      // Store tokens
      await this.tokenStorage.storeUserTokens(validatedUserData.data.id, tokenData);

      // Clean up PKCE data
      await this.tokenStorage.removeUserTokens(`pkce:${state}`);

      // Emit success event
      this.emitAuthEvent(EventType.TWITTER_AUTH_SUCCESS, {
        userId: validatedUserData.data.id,
        username: validatedUserData.data.username
      });

      return tokenData;
    } catch (error) {
      logger.error('OAuth callback failed:', error);
      this.emitAuthEvent(EventType.TWITTER_AUTH_FAILURE, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async refreshTokens(userId: string): Promise<TwitterTokenData> {
    const { clientId, clientSecret } = environment.twitter.oauth2;
    if (!clientId || !clientSecret) {
      throw new Error('Twitter OAuth 2.0 credentials not configured');
    }

    const tokenData = await this.tokenStorage.getUserTokens(userId);
    if (!tokenData?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokenData.refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const tokensResponse: unknown = await response.json();
      const validatedTokens = this.validateTokenResponse(tokensResponse);

      const newTokenData: TwitterTokenData = {
        ...tokenData,
        accessToken: validatedTokens.access_token,
        refreshToken: validatedTokens.refresh_token,
        expiresAt: validatedTokens.expires_in ? Date.now() + validatedTokens.expires_in * 1000 : undefined
      };

      await this.tokenStorage.storeUserTokens(userId, newTokenData);
      return newTokenData;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  async revokeToken(userId: string): Promise<void> {
    const tokens = await this.tokenStorage.getUserTokens(userId);
    if (!tokens) {
      throw new Error('No tokens found for user');
    }

    await this.tokenStorage.removeUserTokens(userId);
    this.emitAuthEvent(EventType.TWITTER_AUTH_FAILURE, {
      userId,
      error: 'Token revoked by user'
    });
  }

  private verifyState(state: string): boolean {
    const storedState = this.stateMap.get(state);
    if (!storedState) {
      return false;
    }

    // Check if state is expired (5 minutes)
    const isExpired = Date.now() - storedState.createdAt > 5 * 60 * 1000;
    if (isExpired) {
      this.stateMap.delete(state);
      return false;
    }

    this.stateMap.delete(state);
    return true;
  }

  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, data] of this.stateMap.entries()) {
      if (now - data.createdAt >= this.STATE_TIMEOUT) {
        this.stateMap.delete(state);
      }
    }
  }

  private emitAuthEvent(
    type: EventType.TWITTER_AUTH_SUCCESS | EventType.TWITTER_AUTH_FAILURE,
    data: { userId?: string; username?: string; error?: string }
  ) {
    if (this.eventBus) {
      const event: TwitterAuthEvent = {
        type: type === EventType.TWITTER_AUTH_SUCCESS ? 
          EventType.TWITTER_AUTH_COMPLETED : 
          EventType.TWITTER_AUTH_FAILED,
        payload: {
          userId: data.userId || 'unknown',
          error: data.error,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        source: 'twitter-oauth-service'
      };
      this.eventBus.emit(event);
    }
  }

  private validateTokenResponse(response: unknown): OAuth2TokenResponse {
    if (
      typeof response === 'object' &&
      response !== null &&
      'access_token' in response &&
      'token_type' in response &&
      typeof (response as any).access_token === 'string' &&
      typeof (response as any).token_type === 'string'
    ) {
      const validatedResponse: OAuth2TokenResponse = {
        access_token: (response as any).access_token,
        token_type: (response as any).token_type
      };

      // Optional fields
      if ('refresh_token' in response && typeof (response as any).refresh_token === 'string') {
        validatedResponse.refresh_token = (response as any).refresh_token;
      }
      if ('expires_in' in response && typeof (response as any).expires_in === 'number') {
        validatedResponse.expires_in = (response as any).expires_in;
      }
      if ('scope' in response && typeof (response as any).scope === 'string') {
        validatedResponse.scope = (response as any).scope;
      }

      return validatedResponse;
    }
    throw new Error('Invalid token response format');
  }

  private validateUserResponse(response: unknown): TwitterUserResponse {
    if (
      typeof response === 'object' &&
      response !== null &&
      'data' in response &&
      typeof (response as any).data === 'object' &&
      (response as any).data !== null &&
      'id' in (response as any).data &&
      'username' in (response as any).data &&
      'name' in (response as any).data &&
      typeof (response as any).data.id === 'string' &&
      typeof (response as any).data.username === 'string' &&
      typeof (response as any).data.name === 'string'
    ) {
      const validatedResponse: TwitterUserResponse = {
        data: {
          id: (response as any).data.id,
          username: (response as any).data.username,
          name: (response as any).data.name
        }
      };
      return validatedResponse;
    }
    throw new Error('Invalid user response format');
  }

  private isPKCEData(data: unknown): data is PKCEData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'codeVerifier' in data &&
      'codeChallenge' in data &&
      'createdAt' in data &&
      typeof (data as any).codeVerifier === 'string' &&
      typeof (data as any).codeChallenge === 'string' &&
      typeof (data as any).createdAt === 'number'
    );
  }
} 