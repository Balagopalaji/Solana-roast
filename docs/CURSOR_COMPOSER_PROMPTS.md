# Cursor Composer Implementation Guide

## Introduction
This guide provides a sequence of focused prompts for implementing the Twitter integration refactor plan. Each prompt is designed to be self-contained while building upon previous work.

## Essential References
- Refactor Plan: `docs/107-TWITTER_INTEGRATION_REFACTOR_PLAN.md`
- Twitter API Documentation:
  - [Media Upload API v1.1](https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference)
  - [Tweet Creation API v2](https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference)
  - [OAuth 1.0a](https://developer.twitter.com/en/docs/authentication/oauth-1-0a)
- Current Implementation: `docs/106-TWITTER_API_INTEGRATION-how-it-worked-in-the-end.md`

## Development Environment Considerations

### ngrok Configuration
The project uses a specific development setup with ngrok that MUST be preserved:

1. **Environment Files**
   - Root `.env`: Contains production configuration
   - Frontend `.env.development`: Contains development-specific overrides
   - The frontend `.env.development` is automatically updated by the `dev:ngrok` script

2. **ngrok Script Workflow**
   ```bash
   # 1. Start development environment
   npm run dev:ngrok
   
   # 2. Script actions:
   # - Kills existing processes (ports 3000, 5173, ngrok)
   # - Starts backend and frontend servers
   # - Starts ngrok tunnel to port 5173
   # - Updates .env.development with new URLs
   
   # 3. Manual steps required:
   # - Copy the ngrok URL from console
   # - Update Twitter Developer Portal:
   #   - Website URL: https://{ngrok-id}.ngrok-free.app
   #   - Callback URL: https://{ngrok-id}.ngrok-free.app/api/twitter/callback
   ```

3. **Critical Files and Their Roles**
   ```typescript
   // scripts/dev.sh
   // - Main orchestration script
   // - Manages process lifecycle
   // - Handles cleanup on exit
   
   // scripts/update-ngrok-urls.ts
   // - Updates .env.development
   // - Format:
   VITE_API_URL=https://{ngrok-id}.ngrok-free.app
   VITE_ENABLE_TWITTER=true
   VITE_TWITTER_CALLBACK_URL=https://{ngrok-id}.ngrok-free.app/api/twitter/callback
   
   // packages/backend/src/app.ts
   // - CORS configuration for ngrok
   app.use(cors({
     origin: [
       'http://localhost:5173',
       'https://solanaroast.lol',
       /^https:\/\/.*\.ngrok-free\.app$/
     ],
     credentials: true
   }));
   ```

4. **Important Technical Notes**
   - Frontend server uses Vite's `strictPort: true` to ensure consistent port usage
   - CORS is configured to accept dynamic ngrok domains
   - Environment updates must not trigger server restarts
   - Twitter callback must match exactly between portal and .env.development

### ngrok Compatibility Testing
Add these test cases to your integration tests:

```typescript
describe('Twitter Integration Development Setup', () => {
  it('should handle ngrok callback URLs correctly', async () => {
    const mockNgrokUrl = 'https://mock-id.ngrok-free.app';
    process.env.VITE_TWITTER_CALLBACK_URL = `${mockNgrokUrl}/api/twitter/callback`;
    
    const service = new TwitterService();
    const authUrl = await service.getAuthUrl();
    
    expect(authUrl).to.include(encodeURIComponent(`${mockNgrokUrl}/api/twitter/callback`));
  });

  it('should accept requests from ngrok domains', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'https://test.ngrok-free.app');
    
    expect(response.headers['access-control-allow-origin'])
      .to.equal('https://test.ngrok-free.app');
  });
});
```

### Additional Edge Case Tests
```typescript
describe('Twitter Integration Edge Cases', () => {
  // 1. Dev Account Functionality
  it('should maintain dev account functionality when user auth is enabled', async () => {
    const devService = new DevTwitterService();
    const userService = new UserTwitterService();
    
    // Enable user auth
    process.env.VITE_ENABLE_TWITTER = 'true';
    
    // Dev service should still work
    const devResult = await devService.shareAsDev(mockTweetData);
    expect(devResult.success).to.be.true;
    
    // User service should work independently
    const userResult = await userService.getAuthUrl();
    expect(userResult).to.include('oauth/authorize');
  });

  // 2. Environment Transitions
  describe('Environment Transitions', () => {
    let originalEnv: string;
    let originalUrls: { base?: string; callback?: string };

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
      originalUrls = {
        base: process.env.VITE_API_URL,
        callback: process.env.VITE_TWITTER_CALLBACK_URL
      };
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      process.env.VITE_API_URL = originalUrls.base;
      process.env.VITE_TWITTER_CALLBACK_URL = originalUrls.callback;
    });

    it('should handle development to production transition', async () => {
      // Start in development
      process.env.NODE_ENV = 'development';
      process.env.VITE_API_URL = 'https://test.ngrok-free.app';
      process.env.VITE_TWITTER_CALLBACK_URL = 'https://test.ngrok-free.app/api/twitter/callback';
      
      const devService = new TwitterService();
      const devUrl = await devService.getAuthUrl();
      expect(devUrl).to.include('ngrok-free.app');

      // Switch to production
      process.env.NODE_ENV = 'production';
      const prodService = new TwitterService();
      const prodUrl = await prodService.getAuthUrl();
      expect(prodUrl).to.include('solanaroast.lol');
    });

    it('should handle production to development transition', async () => {
      // Similar to above but reverse order
    });

    it('should maintain dev account functionality across transitions', async () => {
      const devService = new DevTwitterService();
      
      // Test in development
      process.env.NODE_ENV = 'development';
      const devResult = await devService.shareAsDev(mockTweetData);
      expect(devResult.success).to.be.true;

      // Test in production
      process.env.NODE_ENV = 'production';
      const prodResult = await devService.shareAsDev(mockTweetData);
      expect(prodResult.success).to.be.true;
    });
  });

  // 3. URL Format Validation
  describe('URL Format Validation', () => {
    it('should validate ngrok URL format', () => {
      const validator = new EnvironmentValidator();
      
      // Valid URLs
      expect(() => validator.validateNgrokUrl('https://abc-123.ngrok-free.app')).not.to.throw();
      expect(() => validator.validateNgrokUrl('https://test.ngrok-free.app')).not.to.throw();
      
      // Invalid URLs
      expect(() => validator.validateNgrokUrl('http://test.ngrok-free.app')).to.throw(); // No HTTP
      expect(() => validator.validateNgrokUrl('https://test.ngrok.io')).to.throw(); // Old domain
      expect(() => validator.validateNgrokUrl('https://test.ngrok-free.app/')).to.throw(); // Trailing slash
    });

    it('should validate callback URL format', () => {
      const validator = new EnvironmentValidator();
      
      // Valid URLs
      expect(() => validator.validateCallbackUrl('https://test.ngrok-free.app/api/twitter/callback')).not.to.throw();
      
      // Invalid URLs
      expect(() => validator.validateCallbackUrl('https://test.ngrok-free.app/callback')).to.throw(); // Wrong path
      expect(() => validator.validateCallbackUrl('https://test.ngrok-free.app/api/twitter/callback/')).to.throw(); // Trailing slash
    });
  });
});
```

### Environment Validation
Add these essential checks to your startup routine:

```typescript
// In packages/backend/src/utils/environment-validator.ts
export async function validateEnvironment() {
  // 1. Critical variables check
  const criticalVariables = {
    // Production variables
    TWITTER_API_KEY: process.env.TWITTER_API_KEY,
    TWITTER_API_SECRET: process.env.TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET,
    
    // Development variables (when in dev)
    ...(process.env.NODE_ENV === 'development' ? {
      VITE_API_URL: process.env.VITE_API_URL,
      VITE_TWITTER_CALLBACK_URL: process.env.VITE_TWITTER_CALLBACK_URL
    } : {})
  };

  const missing = Object.entries(criticalVariables)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing critical environment variables: ${missing.join(', ')}`);
  }

  // 2. Dev Account Configuration Validation
  if (!process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_SECRET) {
    throw new Error('Dev account credentials missing. These are required even when user auth is enabled.');
  }

  // Verify dev tokens format
  const tokenFormat = /^[1-9][0-9]*-[A-Za-z0-9]+$/;
  if (!tokenFormat.test(process.env.TWITTER_ACCESS_TOKEN!)) {
    throw new Error('Invalid dev account access token format');
  }

  // 3. URL Format Validation
  if (process.env.NODE_ENV === 'development') {
    // Validate ngrok URL format
    const ngrokUrlPattern = /^https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app$/;
    const callbackUrlPattern = /^https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app\/api\/twitter\/callback$/;
    
    const baseUrl = process.env.VITE_API_URL;
    const callbackUrl = process.env.VITE_TWITTER_CALLBACK_URL;

    if (!ngrokUrlPattern.test(baseUrl!)) {
      throw new Error(`Invalid ngrok base URL format: ${baseUrl}`);
    }
    if (!callbackUrlPattern.test(callbackUrl!)) {
      throw new Error(`Invalid ngrok callback URL format: ${callbackUrl}`);
    }

    // Verify base URL matches callback URL base
    const callbackBase = callbackUrl!.split('/api')[0];
    if (baseUrl !== callbackBase) {
      throw new Error('Base URL and callback URL must use the same ngrok domain');
    }
  }
}

// Add to your startup sequence
app.on('ready', async () => {
  try {
    await validateEnvironment();
    // Continue startup...
  } catch (error) {
    logger.error('Environment validation failed:', error);
    process.exit(1);
  }
});
```

### Common Issues and Solutions

1. **Callback URL Mismatch**
   ```typescript
   // Problem: Twitter callback fails with "Invalid callback URL"
   // Solution: Verify exact match between Twitter portal and .env.development
   
   // In update-ngrok-urls.ts
   const callbackUrl = `${ngrokUrl}/api/twitter/callback`;
   console.log('Verify this matches Twitter portal exactly:', callbackUrl);
   ```

2. **CORS Issues**
   ```typescript
   // Problem: Frontend requests blocked by CORS
   // Solution: Check CORS configuration in backend
   
   // In app.ts, ensure ngrok pattern is correct
   const ngrokPattern = /^https:\/\/.*\.ngrok-free\.app$/;
   if (!ngrokPattern.test(origin)) {
     logger.warn('Rejected origin:', origin);
   }
   ```

3. **Port Conflicts**
   ```bash
   # Problem: "Port already in use" errors
   # Solution: Use the cleanup script
   npm run ngrok:cleanup
   
   # Or manually:
   lsof -ti:5173 | xargs kill -9
   lsof -ti:3000 | xargs kill -9
   pkill -f ngrok
   ```

4. **Environment Updates**
   ```typescript
   // Problem: Environment changes not reflected
   // Solution: Verify update-ngrok-urls.ts execution
   
   // In dev.sh
   echo "Verifying environment update..."
   grep "VITE_TWITTER_CALLBACK_URL" packages/frontend/.env.development
   ```

### Development Workflow Best Practices

1. **Starting Development**
   ```bash
   # 1. Clean start
   npm run ngrok:cleanup
   
   # 2. Start development environment
   npm run dev:ngrok
   
   # 3. Verify environment
   cat packages/frontend/.env.development
   ```

2. **Testing Twitter Integration**
   ```bash
   # 1. Get ngrok URL
   curl -s http://localhost:4040/api/tunnels | grep -o "https://[^\"]*\.ngrok-free.app"
   
   # 2. Update Twitter Developer Portal
   # 3. Test authentication flow
   # 4. Monitor logs for callback issues
   tail -f logs/backend.log | grep "twitter"
   ```

3. **Troubleshooting Steps**
   ```bash
   # 1. Verify ngrok tunnel
   curl -I https://{ngrok-id}.ngrok-free.app
   
   # 2. Check CORS headers
   curl -I -H "Origin: https://{ngrok-id}.ngrok-free.app" \
        http://localhost:3000/api/health
   
   # 3. Verify environment
   npm run verify
   ```

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

## Implementation Sequence

### Phase 0: Core Infrastructure (New)

#### Prompt 0: Infrastructure Setup
```prompt
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
As a senior full-stack engineer, implement the BaseTwitterService abstract class.

BEFORE STARTING:
- Review the Global Reminders section above
- Understand the ngrok development setup
- Check the current environment structure

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
Create the following utility classes in packages/backend/src/services/twitter/utils/:
1. TwitterRateLimiter (basic version)
2. TwitterErrorHandler
3. Basic types and interfaces

These will be enhanced later but we need the basic structure for the services to work.
```

### Phase 2: Dev Service Migration

#### Prompt 3: Dev Service Implementation
```prompt
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
Create integration tests for the DevTwitterService to ensure:
1. All existing functionality works as expected
2. Error handling works correctly
3. Fallback mechanisms are functioning

This will serve as our safety net for future changes.
```

### Phase 3: User Authentication

#### Prompt 5: Token Storage
```prompt
Implement the secure token storage system:
1. Create the SecureTokenStorage class
2. Set up encryption service integration
3. Implement token validation
4. Add proper error handling

Reference section 4.7 "Enhanced Security Implementation" from the refactor plan.
```

#### Prompt 6: Session Management
```prompt
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
Upgrade the rate limiting system:
1. Implement Redis integration
2. Add distributed rate limiting
3. Set up proper configuration
4. Add monitoring

Reference section 4.3 "Enhanced Rate Limiting" from the refactor plan.
```

#### Prompt 8: Media Processing
```prompt
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
Implement the metrics and monitoring system:
1. Set up metrics tracking
2. Implement alert system
3. Add logging enhancements
4. Create monitoring dashboard

Reference section 4.6 "Metrics and Monitoring" from the refactor plan.
```

#### Prompt 10: Feature Flags
```prompt
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
Update the frontend components:
1. Modify RoastDisplay component
2. Add user authentication UI
3. Implement error handling
4. Add loading states

Ensure smooth user experience during the authentication flow.
```

#### Prompt 12: Error Handling
```prompt
Enhance error handling across the application:
1. Implement consistent error messages
2. Add retry mechanisms
3. Improve error recovery
4. Update error documentation
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

## Progress Tracking

Use this section to track implementation progress:

- [ ] Phase 1: Foundation Setup
  - [ ] Base Service Implementation
  - [ ] Core Utilities
- [ ] Phase 2: Dev Service Migration
  - [ ] Dev Service Implementation
  - [ ] Integration Tests
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