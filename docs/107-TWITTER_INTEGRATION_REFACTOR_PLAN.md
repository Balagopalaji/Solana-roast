# Twitter Integration Refactor Plan v1.0.7

## Table of Contents
1. [Overview](#overview)
2. [Current Implementation](#current-implementation)
3. [Refactoring Goals](#refactoring-goals)
4. [Step-by-Step Implementation Guide](#step-by-step-implementation-guide)
5. [Advanced Implementation Details](#advanced-implementation-details)
6. [Testing Strategy](#testing-strategy)
7. [References](#references)

## Overview

### Purpose
This document outlines the plan to refactor the Twitter integration to:
1. Preserve current dev account functionality for future use
2. Implement new user-based Twitter authentication
3. Maintain separation between dev and user functionalities

### Important Notes
- DO NOT delete or modify the current working implementation until the new one is fully tested
- Keep the dev account functionality in a separate module for future use
- Follow Twitter API version requirements strictly
- Implement proper error handling and fallbacks

## Current Implementation

The current implementation uses the app owner's (dev) credentials to tweet:

```typescript
// Current working implementation (to be preserved)
class TwitterService {
  private client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,    // Dev tokens
    accessSecret: process.env.TWITTER_ACCESS_SECRET   
  });

  async uploadImageAndTweet(imageBuffer: Buffer, text: string, url: string) {
    // Working implementation
  }
}
```

### Development Testing Strategy
During the refactoring process, we've added a dedicated test button ("🧪 Test Dev Tweet") in the UI to ensure the current dev account functionality remains working. This button:
1. Uses the existing implementation
2. Runs alongside the new implementation
3. Helps verify the dev account functionality remains intact
4. Provides a quick way to test the original functionality

Location: `packages/frontend/src/components/roast/RoastDisplay.tsx`
```typescript
// Test button implementation
<button
  onClick={handleTwitterShare}
  disabled={isTwitterSharing}
  className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in disabled:opacity-50"
>
  {isTwitterSharing ? '⌛ Testing...' : '🧪 Test Dev Tweet'}
</button>
```

This test button should remain in place until the refactoring is complete and thoroughly tested.

## Refactoring Goals

1. **Preserve Dev Account Functionality**
   - Move current implementation to a separate module
   - Maintain all working features
   - Keep error handling and fallbacks

2. **Add User Authentication**
   - Implement OAuth 1.0a flow
   - Handle user tokens securely
   - Provide clear error messages

3. **Maintain Separation**
   - Keep dev and user functionalities separate
   - Allow easy switching between implementations
   - Preserve fallback mechanisms

## Step-by-Step Implementation Guide

### Step 1: Create Base Abstract Class
```typescript
// File: packages/backend/src/services/twitter/base-twitter.service.ts

abstract class BaseTwitterService {
  protected client: TwitterApi | null = null;
  protected initialized = false;
  protected rateLimiter: TwitterRateLimiter;

  constructor() {
    this.rateLimiter = new TwitterRateLimiter();
  }

  protected async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) throw new Error('Failed to initialize Twitter service');
    }
  }

  protected abstract initialize(): Promise<boolean>;

  protected async uploadMedia(imageBuffer: Buffer): Promise<string> {
    await this.ensureInitialized();
    await this.rateLimiter.checkRateLimit('upload');
    
    if (imageBuffer.length > 5 * 1024 * 1024) {
      return this.uploadLargeMedia(imageBuffer);
    }

    try {
      const mediaId = await this.client!.v1.uploadMedia(imageBuffer, {
        mimeType: 'image/jpeg'
      });
      await this.checkMediaStatus(mediaId);
      return mediaId;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  protected async uploadLargeMedia(imageBuffer: Buffer): Promise<string> {
    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    
    // 1. INIT
    const init = await this.client!.v1.uploadMedia(imageBuffer, {
      mimeType: 'image/jpeg',
      command: 'INIT',
      total_bytes: imageBuffer.length
    });

    // 2. APPEND
    for (let i = 0; i < imageBuffer.length; i += CHUNK_SIZE) {
      const chunk = imageBuffer.slice(i, i + CHUNK_SIZE);
      await this.client!.v1.uploadMedia(chunk, {
        command: 'APPEND',
        media_id: init.media_id_string,
        segment_index: Math.floor(i / CHUNK_SIZE)
      });
    }

    // 3. FINALIZE
    await this.client!.v1.uploadMedia(Buffer.from([]), {
      command: 'FINALIZE',
      media_id: init.media_id_string
    });

    await this.checkMediaStatus(init.media_id_string);
    return init.media_id_string;
  }

  protected async checkMediaStatus(mediaId: string): Promise<boolean> {
    const status = await this.client!.v1.mediaStatus(mediaId);
    if (status.processing_info?.state === 'failed') {
      throw new Error(`Media processing failed: ${status.processing_info.error.message}`);
    }
    return status.processing_info?.state === 'succeeded';
  }

  protected handleApiError(error: any): void {
    const twitterError = error as TwitterApiError;
    if (twitterError.data?.errors?.[0]?.code === 453) {
      throw new Error('Twitter API access level insufficient. Please upgrade to Basic tier.');
    }
  }
}
```

### Step 2: Move Current Implementation to Dev Service
```typescript
// File: packages/backend/src/services/twitter/dev-twitter.service.ts

export class DevTwitterService extends BaseTwitterService {
  protected async initialize(): Promise<boolean> {
    try {
      this.client = new TwitterApi({
        appKey: environment.twitter.apiKey!,
        appSecret: environment.twitter.apiSecret!,
        accessToken: environment.twitter.accessToken!,
        accessSecret: environment.twitter.accessSecret!
      });
      return true;
    } catch (error) {
      logger.error('Dev Twitter service initialization failed:', error);
      return false;
    }
  }

  async shareAsDev(options: TwitterShareOptions): Promise<string> {
    try {
      const imageResponse = await fetch(options.imageUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      
      const mediaId = await this.uploadMedia(imageBuffer);
      
      await this.rateLimiter.checkRateLimit('tweet');
      const tweet = await this.client!.v2.tweet({
        text: `${options.text}\n\nRoast your wallet at ${options.url} 🔥`.substring(0, 280),
        media: { media_ids: [mediaId] }
      });

      return `https://twitter.com/i/status/${tweet.data.id}`;
    } catch (error) {
      logger.error('Dev share failed:', error);
      return this.buildWebIntent(options);
    }
  }

  private buildWebIntent(options: TwitterShareOptions): string {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(options.text)}&url=${encodeURIComponent(options.url)}`;
  }
}
```

### Step 3: Implement User Authentication Service
```typescript
// File: packages/backend/src/services/twitter/user-twitter.service.ts

export class UserTwitterService extends BaseTwitterService {
  private tokenStorage: TwitterTokenStorage;
  private sessionManager: TwitterSessionManager;

  constructor() {
    super();
    this.tokenStorage = new SecureTokenStorage();
    this.sessionManager = new TwitterSessionManager();
  }

  protected async initialize(): Promise<boolean> {
    try {
      this.client = new TwitterApi({
        appKey: environment.twitter.apiKey!,
        appSecret: environment.twitter.apiSecret!
      });
      return true;
    } catch (error) {
      logger.error('User Twitter service initialization failed:', error);
      return false;
    }
  }

  async getAuthUrl(): Promise<string> {
    await this.ensureInitialized();
    const { url, oauth_token, oauth_token_secret } = await this.client!.generateAuthLink(
      environment.twitter.callbackUrl,
      { scope: ['tweet.write', 'tweet.read', 'users.read'] }
    );
    await this.tokenStorage.storeTokens({ oauth_token, oauth_token_secret });
    return url;
  }

  async handleCallback(
    oauth_token: string,
    oauth_verifier: string
  ): Promise<TwitterSession> {
    await this.ensureInitialized();
    const storedTokens = await this.tokenStorage.getTokens();
    if (!storedTokens?.oauth_token_secret) {
      throw new Error('No stored token found');
    }

    const { accessToken, accessSecret } = await this.client!.login(
      oauth_token,
      oauth_verifier
    );

    const session = await this.sessionManager.createSession({
      accessToken,
      accessSecret
    });

    return session;
  }
}
```

### Step 4: Implement Support Services

#### 4.1 Image Processing Pipeline
```typescript
// Add to BaseTwitterService
protected async prepareImageForTwitter(imageUrl: string): Promise<Buffer> {
  // First optimize through Cloudinary
  const cloudinaryUrl = await cloudinaryService.optimizeForTwitter(imageUrl, {
    width: 1200,  // Twitter's recommended size
    height: 675,  // 16:9 aspect ratio
    quality: 'auto:good',
    format: 'jpg',
    flags: ['keep_iptc'] // Preserve metadata
  });

  // Then download optimized image
  const response = await fetch(cloudinaryUrl);
  return Buffer.from(await response.arrayBuffer());
}
```

#### 4.2 Session Management Integration
```typescript
// Add to UserTwitterService
private async integrateWithExistingSession(twitterSession: TwitterSession): Promise<void> {
  // Get existing user session
  const userSession = await sessionService.getCurrentSession();
  
  // Merge Twitter data with existing session
  await sessionService.update(userSession.id, {
    ...userSession,
    twitter: {
      connected: true,
      userId: twitterSession.user_id,
      username: twitterSession.username,
      // Don't store tokens in session data
      lastConnected: new Date().toISOString()
    }
  });

  // Store tokens separately in secure storage
  await this.tokenStorage.storeTokens({
    userId: twitterSession.user_id,
    tokens: twitterSession.tokens
  });
}
```

#### 4.3 Enhanced Rate Limiting
```typescript
// Modify TwitterRateLimiter to use Redis
class TwitterRateLimiter {
  constructor(
    private readonly redisClient: Redis,
    private readonly config: RateLimitConfig
  ) {}

  async checkRateLimit(type: 'upload' | 'tweet', userId: string): Promise<boolean> {
    const key = `twitter:${type}:${userId}`;
    const count = await this.redisClient.incr(key);
    
    if (count === 1) {
      await this.redisClient.expire(key, this.config.WINDOW_MS / 1000);
    }

    const limit = type === 'upload' ? this.config.UPLOAD_LIMIT : this.config.TWEET_LIMIT;
    if (count > limit) {
      throw new RateLimitExceededError(type);
    }

    return true;
  }
}
```

#### 4.4 Error Recovery Strategy
```typescript
// Add to BaseTwitterService
protected async withRetry<T>(
  operation: () => Promise<T>,
  context: {
    type: 'upload' | 'tweet',
    userId?: string,
    imageUrl?: string
  }
): Promise<T> {
  const retryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    shouldRetry: (error: any) => {
      // Specific conditions for retry based on error types
      if (error instanceof RateLimitExceededError) return false;
      if (error instanceof AuthenticationError) return false;
      return true;
    }
  };

  return retryService.execute(
    operation,
    retryConfig,
    {
      onRetry: (error: any, attempt: number) => {
        logger.warn('Twitter operation retry', {
          error,
          attempt,
          context
        });
      }
    }
  );
}
```

#### 4.5 Feature Flag Integration
```typescript
// Add to environment.ts
export const twitterFeatures = {
  enableUserAuth: process.env.ENABLE_TWITTER_USER_AUTH === 'true',
  enableDevAccount: process.env.ENABLE_TWITTER_DEV_ACCOUNT === 'true',
  enableAutoTweet: process.env.ENABLE_TWITTER_AUTO_TWEET === 'true',
  // Integration specific flags
  useCloudinaryOptimization: true,
  enableChunkedUpload: true,
  enableRetryMechanism: true
} as const;

// Usage in services
if (twitterFeatures.enableUserAuth) {
  // Initialize user auth flow
}
```

#### 4.6 Metrics and Monitoring
```typescript
// Add to BaseTwitterService
protected async trackMetrics(
  operation: 'upload' | 'tweet',
  status: 'success' | 'failure',
  metadata: Record<string, any>
): Promise<void> {
  await metricsService.increment(`twitter.${operation}.${status}`, 1, {
    ...metadata,
    environment: process.env.NODE_ENV
  });

  if (status === 'failure') {
    await alertService.notify('twitter_operation_failed', {
      operation,
      ...metadata
    });
  }
}

// Usage in services
async uploadMedia(imageBuffer: Buffer): Promise<string> {
  try {
    const mediaId = await this.client!.v1.uploadMedia(imageBuffer);
    await this.trackMetrics('upload', 'success', { size: imageBuffer.length });
    return mediaId;
  } catch (error) {
    await this.trackMetrics('upload', 'failure', { 
      error: error.message,
      code: error.code 
    });
    throw error;
  }
}
```

#### 4.7 Enhanced Security Implementation
```typescript
// Secure Token Storage Implementation
class SecureTokenStorage implements TwitterTokenStorage {
  async storeTokens(tokens: TwitterTokens): Promise<void> {
    // Use existing encryption service
    const encryptedTokens = await encryptionService.encrypt(
      JSON.stringify(tokens),
      {
        keyId: 'twitter-tokens',
        algorithm: 'aes-256-gcm'
      }
    );

    // Store in secure key-value store
    await secureKVStore.set(
      `twitter:tokens:${tokens.userId}`,
      encryptedTokens,
      {
        expiresIn: '7d',
        encryption: 'already-encrypted'
      }
    );
  }

  async getTokens(userId: string): Promise<TwitterTokens | null> {
    const encryptedTokens = await secureKVStore.get(`twitter:tokens:${userId}`);
    if (!encryptedTokens) return null;

    const decryptedTokens = await encryptionService.decrypt(
      encryptedTokens,
      { keyId: 'twitter-tokens' }
    );

    return JSON.parse(decryptedTokens);
  }

  async clearTokens(userId: string): Promise<void> {
    await secureKVStore.del(`twitter:tokens:${userId}`);
  }
}

// Add to UserTwitterService
private async validateAndRefreshTokens(userId: string): Promise<TwitterTokens> {
  const tokens = await this.tokenStorage.getTokens(userId);
  if (!tokens) {
    throw new AuthenticationError('No Twitter tokens found');
  }

  // Validate tokens with Twitter API
  try {
    const client = new TwitterApi({
      appKey: environment.twitter.apiKey!,
      appSecret: environment.twitter.apiSecret!,
      accessToken: tokens.accessToken,
      accessSecret: tokens.accessSecret
    });

    await client.v2.me(); // Verify tokens are valid
    return tokens;
  } catch (error) {
    if (error.code === 89) { // Invalid tokens
      await this.tokenStorage.clearTokens(userId);
      throw new AuthenticationError('Twitter tokens expired');
    }
    throw error;
  }
}
```

## Testing Strategy

### 1. Unit Tests
```typescript
describe('TwitterService', () => {
  describe('Media Upload', () => {
    it('handles large files with chunked upload');
    it('validates media processing status');
    it('respects rate limits');
  });

  describe('Authentication', () => {
    it('handles OAuth flow correctly');
    it('manages sessions properly');
    it('stores tokens securely');
  });
});
```

### 2. Integration Tests
```typescript
describe('Twitter Integration', () => {
  it('completes full share flow');
  it('handles rate limiting correctly');
  it('recovers from errors appropriately');
});
```

## Using Dev Account Functionality in Future

### 1. Direct Usage
```typescript
const devService = new DevTwitterService();
await devService.shareAsDev({
  text: 'Automated tweet',
  url: 'https://solanaroast.lol',
  imageUrl: 'https://example.com/image.jpg'
});
```

### 2. Feature Flag Control
```typescript
const environment = {
  features: {
    useDevAccount: process.env.USE_DEV_ACCOUNT === 'true'
  }
};

const tweetService = environment.features.useDevAccount 
  ? new DevTwitterService()
  : new UserTwitterService();
```

## References

### Twitter API Documentation
- [Media Upload API](https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-upload)
- [Tweet Creation](https://developer.twitter.com/en/docs/twitter-api/v2/tweets/manage-tweets/api-reference/post-tweets)
- [OAuth 1.0a](https://developer.twitter.com/en/docs/authentication/oauth-1-0a)

### Internal Documentation
- [Current Implementation](docs/TWITTER_API_INTEGRATION-how-it-worked-in-the-end.md)
- [API Analysis](docs/TWITTER_API_ANALYSIS.md)
- [Deployment Checklist](docs/TWITTER_DEPLOYMENT_CHECKLIST.md)

### Important Notes
1. Always use v1.1 for media upload
2. Always use v2 for tweet creation
3. Handle API access level errors (code 453)
4. Maintain fallback mechanisms
5. Keep proper error logging
6. Secure token storage
7. Implement proper rate limiting
8. Handle chunked uploads for large files
9. Check media processing status
10. Manage sessions securely
11. Integrate with existing Cloudinary pipeline for image optimization
12. Use Redis for distributed rate limiting
13. Implement proper metrics tracking
14. Use secure token storage with encryption
15. Implement proper session integration
16. Use feature flags for gradual rollout

---

This document serves as a comprehensive guide for refactoring the Twitter integration while preserving the current functionality for future use. Follow each step carefully and maintain proper error handling and logging throughout the implementation. 