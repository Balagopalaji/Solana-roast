# Cursor Composer Implementation Guide

## Introduction
This guide provides a sequence of focused prompts for implementing the Twitter integration refactor plan. Each prompt is designed to be self-contained while building upon previous work.

## ⚠️ GLOBAL REMINDERS - READ BEFORE EACH PROMPT
Before implementing ANY prompt or making ANY changes:

1. **Role**: Always act as a senior full-stack engineer with extensive TypeScript and Twitter API experience
2. **Documentation**: Keep all documentation up-to-date with changes
3. **Testing**: Write tests for all new functionality
4. **Security**: Follow security best practices, especially for auth flows
5. **Monitoring**: Ensure proper logging and monitoring
6. **Compatibility**: Maintain backward compatibility
7. **Error Handling**: Implement comprehensive error handling
8. **Rate Limiting**: Consider API rate limits in all operations
9. **Type Safety**: Maintain strict TypeScript types
10. **Code Style**: Follow established project patterns

1. **Role**: Always act as a senior full-stack engineer with extensive TypeScript and Twitter API experience
2. **Documentation**: 
   - Study this `CURSOR_COMPOSER_PROMPTS.md` document thoroughly
   - Review all relevant documentation in the `/docs` directory
   - Consult Twitter API documentation for best practices

3. **Codebase Review**:
   - Thoroughly review the existing codebase before making changes
   - Understand the current implementation and its dependencies
   - Check for similar patterns in the codebase
   - Verify type safety and error handling patterns

4. **Critical Requirements**:
   - NEVER break existing functionality
   - Preserve the dev account sharing functionality
   - Maintain the ngrok development setup
   - Keep the environment structure intact
   - Handle errors gracefully with proper logging
   - Consider security implications
   - Write comprehensive tests

5. **Before Completing**:
   - Verify all existing functionality still works
   - Run all tests
   - Check for type safety
   - Validate error handling
   - Review security implications
   - Test backward compatibility
   - Validate API compliance

## Essential References
- Refactor Plan: `docs/107-TWITTER_INTEGRATION_REFACTOR_PLAN.md`
- Twitter API Documentation:
  - [Media Upload API v1.1](https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference)
  - [Tweet Creation API v2](https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference)
  - [OAuth 1.0a](https://developer.twitter.com/en/docs/authentication/oauth-1-0a)
- Current Implementation: `docs/106-TWITTER_API_INTEGRATION-how-it-worked-in-the-end.md`

## Environment Configuration

### Core Principles

1. **Single Source of Truth**
   - All environment variables are managed in the root `.env` file
   - No separate `.env.development` file is needed
   - Environment-specific logic is handled in `environment.ts`

2. **Environment Detection**
   ```typescript
   const isDevelopment = process.env.NODE_ENV === 'development';
   ```

3. **URL Management**
   ```typescript
   // URLs are determined by environment
   const callbackUrl = isDevelopment
     ? process.env.VITE_TWITTER_CALLBACK_URL // From ngrok
     : 'https://solanaroast.lol/api/twitter/callback';
   ```

### Required Environment Variables

1. **Core Variables**
   ```env
   NODE_ENV=development
   PORT=3000
   CORS_ORIGIN=http://localhost:5173
   APP_URL=https://solanaroast.lol
   ```

2. **Twitter Integration**
   ```env
   TWITTER_API_KEY=your_api_key
   TWITTER_API_SECRET=your_api_secret
   TWITTER_ACCESS_TOKEN=your_access_token
   TWITTER_ACCESS_SECRET=your_access_secret
   ```

3. **Development URLs** (Set automatically by ngrok scripts)
   ```env
   VITE_API_URL=https://[ngrok-id].ngrok-free.app
   VITE_TWITTER_CALLBACK_URL=https://[ngrok-id].ngrok-free.app/api/twitter/callback
   ```

### Development Flow

1. **Initial Setup**
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Fill in required values
   vim .env
   ```

2. **Starting Development**
   ```bash
   # Start development with ngrok
   npm run dev:ngrok
   
   # Ngrok will automatically:
   # 1. Start a tunnel
   # 2. Update VITE_* variables in process.env
   # 3. Configure Twitter callback URLs
   ```

3. **URL Management**
   - Ngrok URLs are managed automatically
   - No need to manually maintain a `.env.development` file
   - Twitter callback URLs are updated in real-time

### Environment Validation

```typescript
function validateEnvironment() {
  // Core validation
  const required = [
    'NODE_ENV',
    'PORT',
    'CORS_ORIGIN',
    'APP_URL'
  ];

  // Development-specific validation
  if (process.env.NODE_ENV === 'development') {
    required.push(
      'VITE_API_URL',
      'VITE_TWITTER_CALLBACK_URL'
    );
  }

  // Check for missing variables
  const missing = required.filter(name => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required variables: ${missing.join(', ')}`);
  }
}
```

### Best Practices

1. **Environment Detection**
   ```typescript
   // Use environment.ts for all env checks
   import { environment } from '../config/environment';
   
   if (environment.nodeEnv === 'development') {
     // Development-specific logic
   }
   ```

2. **URL Configuration**
   ```typescript
   // Always use environment.ts for URLs
   const apiUrl = environment.twitter.urls.callback;
   ```

3. **Error Handling**
   ```typescript
   try {
     await validateEnvironment();
   } catch (error) {
     logger.error('Environment validation failed:', error);
     process.exit(1);
   }
   ```

### Common Issues

1. **Missing Variables**
   - Check `.env` file exists and is properly loaded
   - Verify all required variables are set
   - Run `npm run verify` to validate environment

2. **URL Mismatches**
   - Let ngrok scripts manage URLs automatically
   - Don't manually create `.env.development`
   - Use `npm run check:ngrok` to verify URLs

3. **Development Flow**
   - Always use `npm run dev:ngrok` for development
   - Let the scripts handle URL management
   - Check Twitter Developer Portal matches ngrok URLs

## Global Reminders for Each Prompt
Before implementing any prompt, ensure you:
1. Act as a senior full-stack engineer with extensive TypeScript and Twitter API experience
2. Thoroughly review the existing codebase to understand the current implementation
3. Preserve the dev account sharing functionality - it must remain intact for future use
4. Never break existing functionality - all current features must continue working
5. Consult Twitter API documentation when in doubt about implementation details
6. Write comprehensive tests for new functionality
7. Document any assumptions or decisions made
8. Handle errors gracefully with proper logging
9. Consider security implications of changes
10. Maintain type safety throughout the implementation
11. Preserve the ngrok development setup and environment structure

## Future-Proofing Considerations

### Upcoming Features
1. **Top 10 Roasted Wallets**
   - Requires persistent storage
   - Analytics tracking
   - Performance considerations for leaderboard

2. **Degen Features**
   - Easter eggs
   - Animation system
   - Sound system
   - Token integration

### Architectural Adjustments

#### 1. Event System
```typescript
// packages/backend/src/services/events/base-event.service.ts
export interface AppEvent<T = any> {
  type: string;
  payload: T;
  timestamp: number;
  source: string;
}

export abstract class BaseEventService {
  protected abstract handleEvent(event: AppEvent): Promise<void>;
  
  // Allow services to emit events
  protected async emit(event: AppEvent): Promise<void> {
    // Implementation will support both local and distributed events
    // This will help with future features like analytics and notifications
  }
}

// Example usage in TwitterService:
class TwitterService extends BaseEventService {
  async shareAsDev(options: TwitterShareOptions): Promise<string> {
    const result = await this.client.tweet(/*...*/);
    
    await this.emit({
      type: 'ROAST_SHARED',
      payload: {
        walletAddress: options.walletAddress,
        tweetUrl: result.url,
        // Add analytics data
      },
      timestamp: Date.now(),
      source: 'twitter_service'
    });
    
    return result.url;
  }
}
```

#### 1.1 Concrete Event Implementation
```typescript
// packages/backend/src/services/events/events.types.ts
export enum EventType {
  // Roast Events
  ROAST_GENERATED = 'ROAST_GENERATED',
  ROAST_SHARED = 'ROAST_SHARED',
  
  // Twitter Events
  TWITTER_SHARE_STARTED = 'TWITTER_SHARE_STARTED',
  TWITTER_SHARE_COMPLETED = 'TWITTER_SHARE_COMPLETED',
  TWITTER_SHARE_FAILED = 'TWITTER_SHARE_FAILED',
  
  // Analytics Events
  WALLET_ROASTED = 'WALLET_ROASTED',
  LEADERBOARD_UPDATED = 'LEADERBOARD_UPDATED'
}

export interface RoastEvent extends AppEvent {
  type: EventType;
  payload: {
    walletAddress: string;
    roastText: string;
    imageUrl?: string;
    timestamp: number;
    metadata?: {
      solanaTokens?: number;
      nftCount?: number;
    };
  };
}

export interface TwitterShareEvent extends AppEvent {
  type: EventType;
  payload: {
    walletAddress: string;
    tweetUrl?: string;
    error?: string;
    timestamp: number;
    shareMethod: 'dev' | 'user';
  };
}

// packages/backend/src/services/events/event-bus.service.ts
export class EventBusService {
  private static instance: EventBusService;
  private subscribers: Map<EventType, Function[]> = new Map();
  private redis: Redis;

  private constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.setupRedisSubscriber();
  }

  static getInstance(): EventBusService {
    if (!EventBusService.instance) {
      EventBusService.instance = new EventBusService();
    }
    return EventBusService.instance;
  }

  private async setupRedisSubscriber(): Promise<void> {
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe('app_events');
    
    subscriber.on('message', async (channel, message) => {
      const event = JSON.parse(message) as AppEvent;
      await this.processEvent(event);
    });
  }

  private async processEvent(event: AppEvent): Promise<void> {
    const subscribers = this.subscribers.get(event.type) || [];
    await Promise.all(subscribers.map(handler => handler(event)));
  }

  async publish(event: AppEvent): Promise<void> {
    // Local processing
    await this.processEvent(event);
    
    // Distributed processing (for scalability)
    await this.redis.publish('app_events', JSON.stringify(event));
  }

  subscribe(type: EventType, handler: Function): void {
    const handlers = this.subscribers.get(type) || [];
    this.subscribers.set(type, [...handlers, handler]);
  }
}

// Example Twitter Service Integration
class TwitterService extends BaseEventService {
  private eventBus = EventBusService.getInstance();

  async shareAsDev(options: TwitterShareOptions): Promise<string> {
    await this.eventBus.publish({
      type: EventType.TWITTER_SHARE_STARTED,
      payload: {
        walletAddress: options.walletAddress,
        shareMethod: 'dev',
        timestamp: Date.now()
      },
      source: 'twitter_service'
    });

    try {
      const result = await this.client.tweet(/*...*/);
      
      await this.eventBus.publish({
        type: EventType.TWITTER_SHARE_COMPLETED,
        payload: {
          walletAddress: options.walletAddress,
          tweetUrl: result.url,
          shareMethod: 'dev',
          timestamp: Date.now()
        },
        source: 'twitter_service'
      });

      return result.url;
    } catch (error) {
      await this.eventBus.publish({
        type: EventType.TWITTER_SHARE_FAILED,
        payload: {
          walletAddress: options.walletAddress,
          error: error.message,
          shareMethod: 'dev',
          timestamp: Date.now()
        },
        source: 'twitter_service'
      });
      throw error;
    }
  }
}
```

#### 2. Analytics Integration
```typescript
// packages/backend/src/services/analytics/analytics.service.ts
export interface AnalyticsEvent {
  eventName: string;
  properties: Record<string, any>;
  walletAddress?: string;
  timestamp: number;
}

export class AnalyticsService {
  // This will help with the top 10 feature
  async trackRoast(walletAddress: string, data: any): Promise<void> {
    await this.track({
      eventName: 'roast_generated',
      properties: data,
      walletAddress,
      timestamp: Date.now()
    });
  }
}
```

#### 3. UI Component Architecture
```typescript
// packages/frontend/src/components/common/AnimationProvider.tsx
export const AnimationProvider: React.FC = ({ children }) => {
  // Will support future animation needs
  const animationContext = {
    playAnimation: (name: string) => {/*...*/},
    registerAnimation: (name: string, config: any) => {/*...*/}
  };
  
  return (
    <AnimationContext.Provider value={animationContext}>
      {children}
    </AnimationContext.Provider>
  );
};

// packages/frontend/src/components/common/SoundProvider.tsx
export const SoundProvider: React.FC = ({ children }) => {
  // Will support future sound effect needs
  const soundContext = {
    playSound: (name: string) => {/*...*/},
    registerSound: (name: string, url: string) => {/*...*/}
  };
  
  return (
    <SoundContext.Provider value={soundContext}>
      {children}
    </SoundContext.Provider>
  );
};
```

#### 4. Storage Strategy
```typescript
// packages/backend/src/services/storage/base-storage.service.ts
export abstract class BaseStorageService<T> {
  abstract get(key: string): Promise<T | null>;
  abstract set(key: string, value: T): Promise<void>;
  abstract list(pattern: string): Promise<T[]>;
  abstract delete(key: string): Promise<void>;
}

// This will help with both Twitter tokens and future features
export class RedisStorageService<T> extends BaseStorageService<T> {
  // Implementation
}

export class SecureStorageService<T> extends BaseStorageService<T> {
  // Implementation for sensitive data
}
```

#### 4.1 Concrete Storage Implementations
```typescript
// packages/backend/src/services/storage/types.ts
export interface StorageConfig {
  prefix?: string;
  ttl?: number;
  encryption?: boolean;
}

// packages/backend/src/services/storage/redis.storage.ts
export class RedisStorage<T> extends BaseStorageService<T> {
  private redis: Redis;
  private prefix: string;
  private ttl?: number;

  constructor(config: StorageConfig = {}) {
    super();
    this.redis = new Redis(process.env.REDIS_URL);
    this.prefix = config.prefix || '';
    this.ttl = config.ttl;
  }

  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  async get(key: string): Promise<T | null> {
    const data = await this.redis.get(this.getKey(key));
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: T): Promise<void> {
    const data = JSON.stringify(value);
    if (this.ttl) {
      await this.redis.setex(this.getKey(key), this.ttl, data);
    } else {
      await this.redis.set(this.getKey(key), data);
    }
  }

  async list(pattern: string): Promise<T[]> {
    const keys = await this.redis.keys(this.getKey(pattern));
    if (keys.length === 0) return [];

    const values = await this.redis.mget(keys);
    return values
      .filter(Boolean)
      .map(value => JSON.parse(value!));
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(this.getKey(key));
  }
}

// packages/backend/src/services/storage/secure.storage.ts
export class SecureStorage<T> extends BaseStorageService<T> {
  private storage: RedisStorage<string>;
  private encryptionService: EncryptionService;

  constructor(config: StorageConfig = {}) {
    super();
    this.storage = new RedisStorage({ ...config, prefix: 'secure' });
    this.encryptionService = new EncryptionService();
  }

  async get(key: string): Promise<T | null> {
    const encrypted = await this.storage.get(key);
    if (!encrypted) return null;

    const decrypted = await this.encryptionService.decrypt(encrypted);
    return JSON.parse(decrypted);
  }

  async set(key: string, value: T): Promise<void> {
    const data = JSON.stringify(value);
    const encrypted = await this.encryptionService.encrypt(data);
    await this.storage.set(key, encrypted);
  }

  async list(pattern: string): Promise<T[]> {
    const encrypted = await this.storage.list(pattern);
    const decrypted = await Promise.all(
      encrypted.map(async (data) => {
        const decrypted = await this.encryptionService.decrypt(data);
        return JSON.parse(decrypted);
      })
    );
    return decrypted;
  }

  async delete(key: string): Promise<void> {
    await this.storage.delete(key);
  }
}

// Example usage in TwitterService
class TwitterService {
  private tokenStorage: SecureStorage<TwitterTokens>;
  private analyticsStorage: RedisStorage<AnalyticsData>;

  constructor() {
    this.tokenStorage = new SecureStorage({
      prefix: 'twitter:tokens',
      ttl: 7 * 24 * 60 * 60 // 7 days
    });

    this.analyticsStorage = new RedisStorage({
      prefix: 'twitter:analytics'
    });
  }

  async storeUserTokens(userId: string, tokens: TwitterTokens): Promise<void> {
    await this.tokenStorage.set(userId, tokens);
  }

  async trackAnalytics(data: AnalyticsData): Promise<void> {
    const key = `${data.walletAddress}:${Date.now()}`;
    await this.analyticsStorage.set(key, data);
  }
}
```

### Additional Core Component Tests
```typescript
describe('Event System', () => {
  let eventBus: EventBusService;

  beforeEach(() => {
    eventBus = EventBusService.getInstance();
  });

  it('should handle local events', async () => {
    const handler = jest.fn();
    eventBus.subscribe(EventType.ROAST_GENERATED, handler);

    const event: RoastEvent = {
      type: EventType.ROAST_GENERATED,
      payload: {
        walletAddress: '0x123',
        roastText: 'Test roast',
        timestamp: Date.now()
      },
      source: 'test'
    };

    await eventBus.publish(event);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should handle distributed events', async () => {
    // Test Redis pub/sub functionality
  });
});

describe('Storage Services', () => {
  describe('RedisStorage', () => {
    let storage: RedisStorage<any>;

    beforeEach(() => {
      storage = new RedisStorage({ prefix: 'test' });
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
  });

  describe('SecureStorage', () => {
    let storage: SecureStorage<any>;

    beforeEach(() => {
      storage = new SecureStorage({ prefix: 'test' });
    });

    it('should encrypt and decrypt data correctly', async () => {
      const data = { sensitive: 'test' };
      await storage.set('key', data);

      // Verify raw Redis data is encrypted
      const rawStorage = new RedisStorage({ prefix: 'secure:test' });
      const encrypted = await rawStorage.get('key');
      expect(encrypted).not.toEqual(JSON.stringify(data));

      // Verify decryption works
      const decrypted = await storage.get('key');
      expect(decrypted).toEqual(data);
    });
  });
});
```

## Phase 5: Authentication and Infrastructure

⚠️ **CRITICAL INTERMEDIATE STEP**
Before proceeding with Phase 5, we must address test failures in the Redis service implementation:
1. Follow the test fix plan in `docs/107-REDIS_TEST_FIX_PLAN.md`
2. Complete all verification steps
3. Ensure test coverage meets requirements
4. Update documentation

This step is crucial for:
- Maintaining system stability
- Ensuring reliable infrastructure
- Supporting future features
- Preventing technical debt accumulation

Only proceed with Phase 5 after test fixes are complete and verified.

### Prompt 9.5: Redis Infrastructure Setup

BEFORE STARTING:
- Review the Global Reminders section
- Study the current Redis implementation
- Review security best practices
- Understand our distributed requirements

Tasks:

1. Redis Connection Management
   - Implement connection pooling
   - Add retry strategies
   - Configure TLS for production
   - Add health checks

2. Security Configuration
   - Set up password authentication
   - Configure TLS certificates
   - Implement key encryption
   - Add access controls

3. Environment Configuration
   - Development setup
   - Production setup
   - Testing configuration
   - Monitoring integration

4. Monitoring Setup
   - Connection status
   - Memory usage
   - Operation latency
   - Error rates

### Prompt 10: OAuth 2.0 Foundation
```prompt
BEFORE STARTING:
- Review the Global Reminders section at the top of this document
- Ensure Twitter Developer Portal access is configured
- Review Twitter API v2 OAuth documentation
- Understand the ngrok development setup requirements
- Verify Redis is running locally for development

Implement the OAuth 2.0 foundation while preserving v1.1 dev functionality:

1. Development Environment Setup
   - Review ngrok configuration workflow
   - Understand .env.development auto-update mechanism
   - Verify CORS configuration for ngrok domains
   - Test environment validation utilities
   - Configure local Redis:
     * Install and start Redis locally
     * Verify Redis connection
     * Test token storage
     * Configure development settings

2. Dev Account Infrastructure (v1.1)
   - Audit current implementation
   - Document working configurations
   - Add comprehensive error handling
   - Implement retry mechanisms
   - Ensure ngrok compatibility
   - Verify Redis integration:
     * Session storage
     * Rate limiting
     * Event distribution

3. OAuth 2.0 Setup
   - Configure Developer Portal settings for both environments:
     * Production: solanaroast.lol
     * Development: dynamic ngrok URLs
   - Set up required scopes:
     * tweet.read
     * tweet.write
     * users.read
     * offline.access
   - Configure callback URLs:
     * Production: https://solanaroast.lol/api/twitter/callback
     * Development: https://{ngrok-id}.ngrok-free.app/api/twitter/callback
   - Update environment variables
   - Configure Redis for token storage:
     * Development: Local Redis
     * Production: Hosted Redis (TLS enabled)

4. PKCE Implementation
   - Code verifier generation
   - Code challenge creation (S256)
   - State parameter handling
   - Token storage design
   - Environment-aware URL handling
   - Redis token storage implementation:
     * Secure storage service
     * Token encryption
     * Expiry handling
     * Refresh token management

5. Security Foundation
   - Secure token storage
   - CORS configuration for all environments
   - State validation
   - Token encryption
   - Environment-specific security measures
   - Redis security:
     * TLS configuration
     * Password authentication
     * Key encryption
     * Connection pooling

VALIDATION:
- [ ] Dev account functionality preserved
- [ ] OAuth 2.0 credentials configured
- [ ] PKCE utilities implemented
- [ ] Security measures in place
- [ ] ngrok development flow working
- [ ] Environment switching tested
- [ ] Redis operational in development
- [ ] Token storage verified
- [ ] Rate limiting functional
```

### Prompt 11: Hybrid API Integration

### Context
We have successfully implemented the OAuth 2.0 foundation and now need to integrate our hybrid approach for Twitter API interactions. This includes using v1.1 for media uploads and v2 for tweet creation, while maintaining our existing dev account functionality.

### Critical Requirements

1. **Preserve Existing Functionality**:
   - Maintain dev account tweet functionality intact
   - Keep OAuth 1.0a routes and configurations
   - Preserve existing media upload pipeline

2. **Redis Infrastructure**:
   - ✅ Secure token storage with encryption
   - ✅ Session management with Redis Store
   - ✅ Rate limiting with Redis
   - ✅ Health monitoring and metrics

3. **Hybrid API Integration**:
   - Media upload (v1.1):
     * Chunked upload support
     * Status monitoring
     * Retry mechanisms
   - Tweet creation (v2):
     * Enhanced error handling
     * Rate limit management
     * Environment-aware URLs

### Implementation Guide

1. **Media Upload Service**:
```typescript
class TwitterMediaService {
  private readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  private readonly MAX_RETRIES = 3;
  
  async processAndUpload(imageUrl: string, client: TwitterApi): Promise<string> {
    // 1. Optimize image with Cloudinary
    const optimizedUrl = await this.optimizeImage(imageUrl);
    
    // 2. Download and validate
    const buffer = await this.downloadAndValidate(optimizedUrl);
    
    // 3. Upload to Twitter
    const mediaId = buffer.length > this.CHUNK_SIZE
      ? await this.uploadLargeMedia(buffer, client)
      : await this.uploadMedia(buffer, client);
    
    // 4. Monitor processing
    await this.checkMediaStatus(mediaId, client);
    
    return mediaId;
  }
}
```

2. **Tweet Creation Service**:
```typescript
class TwitterService {
  async shareWithMedia(text: string, imageUrl: string): Promise<string> {
    // 1. Process media
    const mediaId = await this.mediaService.processAndUpload(
      imageUrl,
      this.client
    );
    
    // 2. Create tweet with v2 endpoint
    const tweet = await this.client.v2.tweet({
      text: this.formatTweetText(text),
      media: { media_ids: [mediaId] }
    });
    
    return `https://twitter.com/i/web/status/${tweet.data.id}`;
  }
}
```

3. **Rate Limiting Implementation**:
```typescript
const rateLimiter = rateLimit({
  windowMs: environment.twitter.rateLimits.WINDOW_MS,
  max: (req) => {
    if (req.path.includes('/upload')) {
      return environment.twitter.rateLimits.UPLOAD_LIMIT;
    }
    return environment.twitter.rateLimits.TWEET_LIMIT;
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate_limit:'
  })
});
```

4. **Error Recovery**:
```typescript
private async retryWithDelay(fn: () => Promise<any>, context: string): Promise<any> {
  try {
    return await fn();
  } catch (error) {
    if (this.canRetry(error) && this.retryCount < MAX_RETRIES) {
      this.retryCount++;
      await new Promise(resolve => 
        setTimeout(resolve, RETRY_DELAY * this.retryCount)
      );
      return this.retryWithDelay(fn, context);
    }
    throw this.handleError(error);
  }
}
```

### Testing Requirements

1. **Media Upload Tests**:
   - Test chunked upload functionality
   - Verify retry mechanisms
   - Test error handling
   - Validate media constraints

2. **Tweet Creation Tests**:
   - Test v2 endpoint integration
   - Verify rate limiting
   - Test error scenarios
   - Validate tweet formatting

3. **Integration Tests**:
   - Test full upload-to-tweet flow
   - Verify Redis integration
   - Test session handling
   - Validate monitoring

### Monitoring Requirements

1. **Media Upload Monitoring**:
   - Track upload success rates
   - Monitor processing times
   - Track retry attempts
   - Log validation failures

2. **Rate Limit Monitoring**:
   - Track rate limit usage
   - Monitor rate limit errors
   - Track endpoint usage
   - Alert on threshold breaches

3. **Redis Monitoring**:
   - Monitor connection status
   - Track memory usage
   - Monitor operation latency
   - Track error rates

### Documentation Updates

1. **API Integration**:
   - Document v1.1 vs v2 usage
   - Detail media upload flow
   - Explain rate limiting
   - Document error handling

2. **Redis Infrastructure**:
   - Document token storage
   - Detail session handling
   - Explain monitoring setup
   - Document rate limiting

### Verification Checklist

- [ ] Media upload service implemented and tested
- [ ] Tweet creation with v2 endpoint working
- [ ] Rate limiting properly configured
- [ ] Error recovery mechanisms tested
- [ ] Redis monitoring in place
- [ ] Documentation updated
- [ ] Integration tests passing
- [ ] Monitoring alerts configured

### References

1. [Twitter API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets)
2. [Media Upload API Documentation](https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-upload)
3. [Rate Limiting Guidelines](https://developer.twitter.com/en/docs/twitter-api/rate-limits)
4. [Redis Best Practices](https://redis.io/topics/best-practices)

## Implementation Sequence

### Phase 0: Core Infrastructure (New)

#### Prompt 0: Infrastructure Setup
```prompt
BEFORE STARTING:
- Review the Global Reminders section at the top of this document
- Understand the ngrok development setup
- Check the current environment structure

As a senior full-stack engineer, implement the core infrastructure components that will support both the Twitter integration and future features:

1. Set up the event system
2. Implement the base storage service
3. Create the analytics service structure
4. Set up the UI providers for animations and sounds

IMPORTANT:
- These components should be generic enough to support future features
- Consider performance implications
- Implement with scalability in mind
- Add proper documentation
```

### Phase 1: Foundation Setup

#### Prompt 1: Base Service Implementation
```prompt
BEFORE STARTING:
- Review the Global Reminders section at the top of this document
- Understand the ngrok development setup
- Check the current environment structure

As a senior full-stack engineer, implement the BaseTwitterService abstract class.

IMPORTANT REMINDERS:
- Current dev account functionality must be preserved
- Review existing codebase first: packages/backend/src/services/twitter/*
- Consult Twitter API docs for best practices
- Ensure backward compatibility
- Add comprehensive error handling
- Maintain the current environment configuration structure

Tasks:
1. Set up the basic class structure with TypeScript
2. Implement the core initialization logic
3. Add basic error handling
4. Ensure the structure supports both dev and user authentication flows
5. Verify compatibility with the ngrok development setup

Reference:
- Section "Step 1: Create Base Abstract Class" in docs/107-TWITTER_INTEGRATION_REFACTOR_PLAN.md
- Current implementation in packages/backend/src/services/twitter.service.ts
- Development setup in scripts/dev.sh and scripts/update-ngrok-urls.ts
```

#### Prompt 2: Core Utilities
```prompt
BEFORE STARTING:
- Review the Global Reminders section at the top of this document
- Understand the ngrok development setup
- Check the current environment structure

Create the following utility classes in packages/backend/src/services/twitter/utils/:
1. TwitterRateLimiter (basic version)
2. TwitterErrorHandler
3. Basic types and interfaces

These will be enhanced later but we need the basic structure for the services to work.
```

### Phase 2: Dev Service Migration

#### Prompt 3: Dev Service Implementation
```prompt
BEFORE STARTING:
- Review the Global Reminders section at the top of this document
- Understand the ngrok development setup
- Check the current environment structure

As a senior full-stack engineer, implement the DevTwitterService class.

CRITICAL: This implementation preserves our existing Twitter functionality!

IMPORTANT REMINDERS:
- The dev account sharing feature MUST continue working exactly as before
- Review current implementation thoroughly before making changes
- Consult Twitter API docs for any uncertainties
- Test extensively to ensure no regression

Tasks:
1. Move current implementation into the new structure
2. Ensure all existing functionality is preserved
3. Add proper error handling and logging
4. Implement the fallback mechanism
5. Verify the dev account sharing still works

Reference:
- Current working implementation in packages/backend/src/services/twitter.service.ts
- Section "Step 2: Move Current Implementation to Dev Service" in refactor plan
- Twitter API v2 Tweet creation docs for verification
```

#### Prompt 4: Integration Test Setup
```prompt
BEFORE STARTING:
- Review the Global Reminders section at the top of this document
- Understand the ngrok development setup
- Check the current environment structure

Create integration tests for the DevTwitterService to ensure:
1. All existing functionality works as expected
2. Error handling works correctly
3. Fallback mechanisms are functioning

This will serve as our safety net for future changes.
```

### Phase 3: User Authentication

#### Prompt 5: Token Storage
```prompt
BEFORE STARTING:
- Review the Global Reminders section at the top of this document
- Understand the ngrok development setup
- Check the current environment structure

Implement the secure token storage system:
1. Create the SecureTokenStorage class
2. Set up encryption service integration
3. Implement token validation
4. Add proper error handling

Reference section 4.7 "Enhanced Security Implementation" from the refactor plan.
```

#### Prompt 6: Session Management
```prompt
BEFORE STARTING:
- Review the Global Reminders section at the top of this document
- Understand the ngrok development setup
- Check the current environment structure

Implement the session management system:
1. Create TwitterSessionManager
2. Set up session integration
3. Implement token refresh logic
4. Add session validation

Use section 4.2 "Session Management Integration" as reference.
```

### Phase 4: Enhanced Features

#### Prompt 7: Enhanced Rate Limiting
```prompt
BEFORE STARTING:
- Review the Global Reminders section at the top of this document
- Understand the ngrok development setup
- Check the current environment structure

Upgrade the rate limiting system:
1. Implement Redis integration
2. Add distributed rate limiting
3. Set up proper configuration
4. Add monitoring

Reference section 4.3 "Enhanced Rate Limiting" from the refactor plan.
```

#### Prompt 8: Media Processing
```prompt
BEFORE STARTING:
- Review the Global Reminders section at the top of this document
- Understand the ngrok development setup
- Check the current environment structure

Implement the enhanced media processing:
1. Set up Cloudinary integration
2. Implement chunked upload
3. Add media status checking
4. Implement error recovery

Use sections 4.1 and 4.4 from the refactor plan.
```

### Phase 5: Infrastructure

#### Prompt 9: Metrics and Monitoring
```prompt
BEFORE STARTING:
- Review the Global Reminders section at the top of this document
- Understand the ngrok development setup
- Check the current environment structure

Implement the metrics and monitoring system:
1. Set up metrics tracking
2. Implement alert system
3. Add logging enhancements
4. Create monitoring dashboard

Reference section 4.6 "Metrics and Monitoring" from the refactor plan.
```

#### Prompt 10: Feature Flags
```prompt
BEFORE STARTING:
- Review the Global Reminders section at the top of this document
- Understand the ngrok development setup
- Check the current environment structure

Implement the feature flag system:
1. Set up environment configuration
2. Add feature flag definitions
3. Implement feature flag checks
4. Add documentation

Use section 4.5 "Feature Flag Integration" as reference.
```

### Phase 6: Frontend Integration

#### Prompt 11: Frontend Components
```prompt
BEFORE STARTING:
- Review the Global Reminders section at the top of this document
- Understand the ngrok development setup
- Check the current environment structure

Update the frontend components:
1. Modify RoastDisplay component
2. Add user authentication UI
3. Implement error handling
4. Add loading states

Ensure smooth user experience during the authentication flow.
```

#### Prompt 12: Error Handling
```prompt
BEFORE STARTING:
- Review the Global Reminders section at the top of this document
- Understand the ngrok development setup
- Check the current environment structure

Enhance error handling across the application:
1. Implement consistent error messages
2. Add retry mechanisms
3. Improve error recovery
4. Update error documentation
```

### Phase 7: Documentation and Process Recording

#### Prompt 13: Implementation Documentation
```prompt
BEFORE STARTING:
- Review the Global Reminders section at the top of this document
- Understand the ngrok development setup
- Check the current environment structure

As a senior full-stack engineer, document the complete implementation process:

1. Create a detailed implementation log:
   - Document each major change and decision
   - Include rationale for architectural choices
   - Note any challenges encountered and solutions
   - Record performance considerations

2. Update technical documentation:
   - Update API documentation
   - Document new endpoints and services
   - Add sequence diagrams for auth flows
   - Document testing procedures

3. Create migration guides:
   - Document steps for future Twitter API migrations
   - Include rollback procedures
   - Add troubleshooting guides

4. Add monitoring documentation:
   - Document metrics and alerts
   - Add dashboard explanations
   - Include incident response procedures

IMPORTANT:
- Include code snippets and examples
- Add diagrams where helpful
- Document both dev and user authentication flows
- Include testing procedures
```

## Best Practices for Composer Agent

### Context Management
1. Always start by reading the relevant sections of the refactor plan
2. Maintain awareness of previously implemented components
3. Consider dependencies between components

### Implementation Strategy
1. Implement one component at a time
2. Add comprehensive error handling
3. Include proper logging
4. Write tests for each component

### Quality Assurance
1. Verify type safety
2. Ensure proper error handling
3. Check for security best practices
4. Maintain consistent coding style

### Documentation
1. Add JSDoc comments
2. Update README files
3. Document configuration requirements
4. Maintain changelog

### Testing and Verification
1. Use the "🧪 Test Dev Tweet" button in RoastDisplay to verify dev account functionality
2. This button is specifically added to ensure the original implementation remains working
3. Test both the new and existing functionality in parallel
4. Use the test button as a reference for expected behavior

Example test verification:
```typescript
// In your implementation, verify both buttons work:
it('should maintain dev account functionality alongside new implementation', async () => {
  render(<RoastDisplay roastData={mockRoastData} />);
  
  // Test dev account button
  const devButton = screen.getByText(/🧪 Test Dev Tweet/);
  await userEvent.click(devButton);
  expect(socialShareService.shareToTwitter).toHaveBeenCalledWith(
    expect.objectContaining({ shareMethod: 'dev' })
  );
  
  // Test new implementation
  const userButton = screen.getByText(/🐦 Tweet/);
  await userEvent.click(userButton);
  expect(socialShareService.shareToTwitter).toHaveBeenCalledWith(
    expect.objectContaining({ shareMethod: 'user' })
  );
});
```

### Documentation Strategy
1. **Per-Prompt Documentation**
   ```typescript
   // At the end of each prompt implementation:
   await documentImplementation({
     prompt: currentPrompt,
     changes: {
       files: changedFiles,
       services: newOrModifiedServices,
       tests: addedTests
     },
     decisions: architecturalDecisions,
     challenges: {
       encountered: issuesFound,
       solutions: implementedSolutions
     }
   });
   ```

2. **Incremental Architecture Records**
   - Document each architectural decision
   - Record the context of each decision
   - Note alternatives considered
   - Explain why the chosen solution was selected

3. **Progress Documentation**
   ```typescript
   // Example progress documentation
   interface ImplementationProgress {
     phase: string;
     prompt: string;
     completedTasks: string[];
     pendingTasks: string[];
     testResults: TestResult[];
     architecturalChanges: ArchitecturalDecision[];
     nextSteps: string[];
   }
   ```

4. **Review Checkpoints**
   After each phase:
   - Document completed functionality
   - Record test coverage
   - Note any technical debt
   - Update migration guides
   - Review and update security documentation

Example documentation entry:
```markdown
## Implementation Log: Phase 2 - Dev Service Migration

### Changes Made
- Moved TwitterService to DevTwitterService
- Added BaseTwitterService abstraction
- Implemented rate limiting
- Added comprehensive tests

### Architectural Decisions
1. **Service Separation**
   - Decision: Split into Base/Dev/User services
   - Context: Need to preserve dev functionality
   - Alternatives considered:
     - Single service with mode switch
     - Feature flag-based implementation
   - Rationale: Cleaner separation, easier testing

2. **Rate Limiting**
   - Implementation: Redis-based
   - Reason: Scalable, supports distributed setup
   - Alternative considered: In-memory rate limiting
   - Why rejected: Wouldn't work in distributed environment

### Challenges & Solutions
1. **Challenge**: Maintaining state during migration
   Solution: Implemented parallel services
   
2. **Challenge**: Rate limit sharing
   Solution: Created shared Redis-based limiter

### Test Coverage
- Unit tests: 94%
- Integration tests: 87%
- E2E tests: Added Twitter flow

### Next Steps
1. Review error handling
2. Add monitoring
3. Update documentation
```

## Progress Tracking

Use this section to track implementation progress:

- [ ] Phase 1: Foundation Setup
  - [ ] Base Service Implementation
  - [ ] Core Utilities
  - [ ] Phase 1 Documentation
- [ ] Phase 2: Dev Service Migration
  - [ ] Dev Service Implementation
  - [ ] Integration Tests
  - [ ] Phase 2 Documentation
- [ ] Phase 3: User Authentication
  - [ ] Token Storage
  - [ ] Session Management
- [ ] Phase 4: Enhanced Features
  - [ ] Enhanced Rate Limiting
  - [ ] Media Processing
- [ ] Phase 5: Infrastructure
  - [ ] Metrics and Monitoring
  - [ ] Feature Flags
- [ ] Phase 6: Frontend Integration
  - [ ] Frontend Components
  - [ ] Error Handling
- [ ] Phase 7: Documentation
  - [ ] Implementation Log
  - [ ] Technical Documentation
  - [ ] Migration Guides
  - [ ] Monitoring Documentation

## Notes for Review
- Each phase should be reviewed before moving to the next
- Test coverage should be maintained throughout
- Security considerations should be prioritized
- Backward compatibility must be maintained

## Additional Best Practices

### Code Review Checklist
Before submitting any changes:
1. Verify dev account functionality remains intact
2. Run all tests (unit and integration)
3. Check for type safety
4. Verify error handling
5. Review security implications
6. Test backward compatibility
7. Validate API compliance

### Security Considerations
1. Token storage security
2. Rate limiting implementation
3. Error message safety
4. Input validation
5. Authentication flows
6. Session management

### Monitoring and Validation
1. Add logging for all critical operations
2. Implement proper metrics
3. Set up alerts for failures
4. Monitor rate limits
5. Track API usage

### Documentation Requirements
1. Update technical documentation
2. Add inline code comments
3. Update README files
4. Document configuration changes
5. Update API documentation

### Development Environment
1. Preserve the ngrok setup
2. Maintain environment file structure
3. Keep manual Twitter portal update workflow
4. Test with both development and production configs

## Additional Notes
- When in doubt about API behavior, always consult the official Twitter documentation
- Keep the refactor plan open as a reference throughout implementation
- Maintain a test-driven development approach
- Document any deviations from the plan with justification
- Consider edge cases and error scenarios
- Keep security as a top priority

---

This guide provides a structured approach for implementing the Twitter integration refactor plan. Follow the prompts in sequence, ensuring each component is properly implemented and tested before moving to the next phase. 