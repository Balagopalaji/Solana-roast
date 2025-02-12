# Twitter Integration Implementation Guide

## Overview

This document details the phased implementation of Twitter integration in the Solana Roast project, focusing on Phases 0 and 1. It serves as both a historical record and a troubleshooting guide for future development.

## Prerequisites
✅ Redis Test Implementation (Completed January 2024)
- Implemented proper Redis service mocking
- Fixed all TypeScript errors in tests
- Added comprehensive test coverage
- Prepared foundation for Twitter integration

## Phase 0: Initial Dev Account Implementation

### Implementation Strategy
1. **Basic Setup**
   - Created dev Twitter account
   - Set up Twitter Developer Portal access
   - Generated API keys and tokens
   - Implemented basic tweet functionality

2. **Core Components**
   ```typescript
   // Initial TwitterService implementation
   class TwitterService {
     private client: TwitterApi | null = null;
     
     async initialize(): Promise<boolean> {
       this.client = new TwitterApi({
         appKey: process.env.TWITTER_API_KEY!,
         appSecret: process.env.TWITTER_API_SECRET!,
         accessToken: process.env.TWITTER_ACCESS_TOKEN!,
         accessSecret: process.env.TWITTER_ACCESS_SECRET!
       });
       return true;
     }
   }
   ```

### Common Pitfalls & Solutions

1. **API Version Mismatch**
   - **Problem**: Different endpoints require different API versions
   - **Solution**: Use v1.1 for media upload, v2 for tweet creation
   ```typescript
   // Correct implementation
   const mediaId = await client.v1.uploadMedia(buffer);
   const tweet = await client.v2.tweet({
     text: text,
     media: { media_ids: [mediaId] }
   });
   ```

2. **Media Upload Issues**
   - **Problem**: Incorrect media upload parameters
   - **Solution**: Use `mimeType` instead of `type`
   ```typescript
   // Wrong
   await client.v1.uploadMedia(buffer, { type: 'image/jpeg' });
   
   // Correct
   await client.v1.uploadMedia(buffer, { mimeType: 'image/jpeg' });
   ```

3. **Environment Variables**
   - **Problem**: Missing or incorrect environment variables
   - **Solution**: Implement proper validation
   ```typescript
   if (!process.env.TWITTER_API_KEY) {
     throw new Error('Missing Twitter API credentials');
   }
   ```

## Phase 1: Dev Account Refactor

### Key Changes

1. **Service Architecture**
   ```typescript
   // Base abstract class
   abstract class BaseTwitterService {
     protected client: TwitterApi | null = null;
     protected initialized = false;
     
     abstract initializeClient(): Promise<void>;
     abstract shareWithMedia(text: string, imageUrl: string): Promise<string>;
   }

   // Dev implementation
   class DevTwitterService extends BaseTwitterService {
     // Implementation specific to dev account
   }
   ```

2. **Error Handling Improvements**
   ```typescript
   try {
     const mediaId = await this.client.v1.uploadMedia(buffer);
   } catch (error) {
     if (error.code === 453) {
       throw new Error('API access level insufficient');
     }
     // Handle other errors
   }
   ```

### Critical Components

1. **Media Upload Pipeline**
   ```typescript
   async shareWithMedia(text: string, imageUrl: string): Promise<string> {
     // 1. Download image
     const imageResponse = await fetch(imageUrl);
     const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

     // 2. Size validation (5MB limit)
     if (imageBuffer.length > 5 * 1024 * 1024) {
       throw new Error('Image too large');
     }

     // 3. Upload to Twitter
     const mediaId = await this.client.v1.uploadMedia(imageBuffer, {
       mimeType: 'image/jpeg'
     });

     // 4. Create tweet
     const tweet = await this.client.v2.tweet({
       text: tweetText,
       media: { media_ids: [mediaId] }
     });

     return `https://twitter.com/i/web/status/${tweet.data.id}`;
   }
   ```

2. **Development Mode Handling**
   ```typescript
   if (process.env.NODE_ENV === 'development') {
     // Skip strict validation
     this.initialized = true;
     logger.info('⚠️  After ngrok starts:');
     logger.info('1. Update Twitter Developer Portal URLs');
     logger.info('2. Restart the server');
     return;
   }
   ```

### Common Issues & Solutions

1. **HTTP 500 Errors**
   - **Cause**: Over-validation of media
   - **Solution**: Simplify validation, trust Twitter's API
   ```typescript
   // Remove complex validation
   // Just check file size
   if (buffer.length > 5 * 1024 * 1024) {
     throw new Error('Image too large');
   }
   ```

2. **Authentication Failures**
   - **Cause**: Missing or invalid credentials
   - **Solution**: Implement proper status checking
   ```typescript
   public async getStatus(): Promise<TwitterServiceStatus> {
     return {
       initialized: this.initialized,
       hasApiKey: !!environment.twitter.apiKey,
       // ... other status checks
     };
   }
   ```

3. **Development Environment Issues**
   - **Cause**: ngrok URL not updated in Twitter Developer Portal
   - **Solution**: Clear instructions and checks
   ```typescript
   if (!this.initialized) {
     logger.error('Please update Twitter Developer Portal:');
     logger.error(`Website URL: ${ngrokUrl}`);
     logger.error(`Callback URL: ${ngrokUrl}/api/twitter/callback`);
   }
   ```

### Best Practices

1. **API Usage**
   - Always use v1.1 for media upload
   - Always use v2 for tweet creation
   - Keep media upload parameters simple
   - Trust Twitter's built-in validation

2. **Error Handling**
   - Log detailed error information
   - Implement specific handling for common error codes
   - Provide clear user feedback
   - Use event emission for tracking

3. **Development Flow**
   - Start ngrok first
   - Update Twitter Developer Portal URLs
   - Restart server
   - Test with dev account
   - Monitor logs for issues

## Phase 2: Core Infrastructure

### Key Components

1. **Redis Service Management**
   ```bash
   # Start Redis for development (MUST be done BEFORE npm run dev)
   npm run dev:services:start

   # Verify Redis is running
   redis-cli ping

   # Stop Redis when needed
   npm run dev:services:stop
   ```

   **Important**: Redis must be started before running the development servers.
   If you started the servers without Redis:
   1. Stop the development servers (Ctrl+C)
   2. Start Redis
   3. Restart the development servers

2. **Event System**
   ```typescript
   // Base event service with Redis pub/sub
   abstract class BaseEventService {
     protected redis: Redis;
     protected subscribers: Map<string, Function[]>;

     async emit(event: AppEvent): Promise<void> {
       // Local and distributed event processing
       await this.processEvent(event);
       await this.redis.publish('app_events', JSON.stringify(event));
     }
   }
   ```

3. **Storage System**
   ```typescript
   // Base storage with Redis backend
   abstract class BaseStorageService<T> {
     protected redis: Redis;
     protected prefix: string;
     protected ttl?: number;

     abstract get(key: string): Promise<T | null>;
     abstract set(key: string, value: T): Promise<void>;
   }

   // Type-safe Redis implementation
   class RedisStorage<T> extends BaseStorageService<T> {
     constructor(config: StorageConfig = {}) {
       super(config);
       this.prefix = config.prefix || '';
       this.ttl = config.ttl;
     }

     protected getKey(key: string): string {
       return this.prefix ? `${this.prefix}:${key}` : key;
     }
   }
   ```

4. **Redis Implementation Pitfalls**
   - **Problem**: Attempting to use methods not yet implemented
   - **Solution**: Implement missing methods in correct order
   ```typescript
   // Example: Implementing expire before using setWithExpiry
   public async expire(key: string, seconds: number): Promise<void> {
     await this.client.expire(key, seconds);
   }
   ```

   - **Problem**: Type mismatches in stored data
   - **Solution**: Proper serialization before storage
   ```typescript
   // Correct implementation
   const serializedValue = JSON.stringify(value);
   await this.redisService.set(fullKey, serializedValue);
   ```

   - **Problem**: Missing method implementations in service classes
   - **Solution**: Complete implementation of all abstract methods
   ```typescript
   class RedisStorage<T> extends BaseStorageService<T> {
     async setWithExpiry(key: string, value: T, ttlSeconds: number): Promise<void>;
     async getTimeToLive(key: string): Promise<number | null>;
   }
   ```

   - **Problem**: TypeScript linting errors with generic storage types
   - **Solution**: Create separate type definition files for stored data structures
   ```typescript
   // roast.types.ts
   export interface StoredRoastResponse {
     roast: string;
     meme_url: string;
     wallet: {
       address: string;
       balance: number;
       lastActivity?: string; // ISO string format
     };
     timestamp: number;
   }

   // roast.storage.ts
   class RoastStorage extends RedisStorage<StoredRoastResponse> {
     // Now TypeScript knows exactly what T represents
   }
   ```

5. **Secure Storage**
   ```typescript
   // AES-256-GCM encryption for sensitive data
   class SecureStorage<T> extends BaseStorageService<T> {
     private readonly algorithm = 'aes-256-gcm';
     private encryptionKey: Buffer;

     async encrypt(text: string): Promise<EncryptedData> {
       const iv = randomBytes(16);
       const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);
       // ... encryption implementation
     }
   }
   ```

6. **Redis Service**
   ```typescript
   class RedisService extends EventEmitter {
     private static instance: RedisService;
     private clients: Map<string, Redis>;
     private metrics: RedisMetrics;

     async getClient(name: string = 'default', config?: RedisConfig): Promise<Redis> {
       // Connection pooling
       // Health monitoring
       // Metrics collection
     }

     getMetrics(): RedisMetrics {
       return { ...this.metrics };
     }
   }
   ```

7. **Monitoring Service**
   ```typescript
   class RedisMonitorService extends EventEmitter {
     private config: MonitorConfig;
     private metrics: RedisMetrics;

     start(): void {
       // Health checks
       // Metrics collection
       // Alert emission
     }

     onAlert(handler: (alert: RedisAlert) => void): void {
       this.on('alert', handler);
     }
   }
   ```

### Common Issues & Solutions

1. **Redis Connection Issues**
   - **Problem**: Redis connection failures in distributed setup
   - **Solution**: Implement connection pooling and retry logic
   ```typescript
   const client = new Redis({
     retryStrategy: (times) => Math.min(times * 50, 2000),
     maxRetriesPerRequest: 3,
     connectionTimeout: 5000
   });
   ```

2. **Event Race Conditions**
   - **Problem**: Events processed out of order
   - **Solution**: Implement event versioning and ordering
   ```typescript
   interface AppEvent {
     sequence: number;
     timestamp: number;
     // ... other fields
   }
   ```

3. **Memory Management**
   - **Problem**: Redis memory growth
   - **Solution**: Monitor usage and implement TTLs
   ```typescript
   // Monitor memory usage
   const info = await client.info('memory');
   const usedMemory = info.match(/used_memory:(\d+)/);

   // Set TTL on keys
   await client.setex(key, ttl, value);
   ```

4. **Performance Issues**
   - **Problem**: Slow operations
   - **Solution**: Track latency and optimize
   ```typescript
   // Track operation latency
   const startTime = Date.now();
   await operation();
   const latency = Date.now() - startTime;
   ```

### Best Practices

1. **Connection Management**
   - Use connection pooling
   - Implement retry strategies
   - Enable TLS in production
   - Monitor connection health

2. **Data Storage**
   - Use type-safe operations
   - Implement proper error handling
   - Set appropriate TTLs
   - Use prefix namespacing

3. **Monitoring**
   - Track connection status
   - Monitor memory usage
   - Track operation latency
   - Set up alerts

4. **Security**
   - Enable TLS in production
   - Use strong passwords
   - Implement access controls
   - Encrypt sensitive data

### References

1. **Internal Documentation**
   - [Redis Service](packages/backend/src/services/storage/redis.service.ts)
   - [Redis Storage](packages/backend/src/services/storage/redis.storage.ts)
   - [Redis Monitor](packages/backend/src/services/monitoring/redis-monitor.service.ts)
   - [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md)

2. **External Documentation**
   - [Redis Documentation](https://redis.io/documentation)
   - [IORedis Documentation](https://github.com/luin/ioredis)
   - [Node.js Redis Best Practices](https://redis.io/topics/clients#nodejs)

## Phase 3: Rate Limiting

### Implementation

1. **Rate Limiter Service**
   ```typescript
   class TwitterRateLimiter {
     private readonly config: RateLimitConfig = {
       WINDOW_MS: 900000,     // 15 minutes
       UPLOAD_LIMIT: 30,      // Media uploads
       TWEET_LIMIT: 50        // Tweet creations
     };

     async checkRateLimit(type: 'upload' | 'tweet', userId: string): Promise<boolean> {
       const key = `twitter:${type}:${userId}`;
       const count = await this.redis.incr(key);
       // ... rate limit logic
     }
   }
   ```

2. **Factory Pattern**
   ```typescript
   // Singleton factory for rate limiter
   export function getTwitterRateLimiter(): TwitterRateLimiter {
     if (!rateLimiterInstance) {
       rateLimiterInstance = new TwitterRateLimiter(
         new Redis(process.env.REDIS_URL),
         environment.twitter.rateLimits
       );
     }
     return rateLimiterInstance;
   }
   ```

### Common Issues & Solutions

1. **Distributed Rate Limiting**
   - **Problem**: Race conditions in distributed environment
   - **Solution**: Use Redis atomic operations
   ```typescript
   const count = await this.redis.incr(key);
   if (count === 1) {
     await this.redis.expire(key, this.config.WINDOW_MS / 1000);
   }
   ```

2. **Rate Limit Recovery**
   - **Problem**: Stuck rate limits after errors
   - **Solution**: Implement reset functionality
   ```typescript
   async resetLimits(userId: string): Promise<void> {
     await Promise.all([
       this.redis.del(`twitter:upload:${userId}`),
       this.redis.del(`twitter:tweet:${userId}`)
     ]);
   }
   ```

## Phase 4: Enhanced Media Processing

### Implementation

1. **Media Service**
   ```typescript
   class TwitterMediaService {
     private readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks

     async processAndUpload(imageUrl: string): Promise<string> {
       // 1. Optimize through Cloudinary
       const optimizedUrl = await this.optimizeImage(imageUrl);
       
       // 2. Chunked upload for large files
       const mediaId = buffer.length > this.CHUNK_SIZE 
         ? await this.uploadLargeMedia(buffer)
         : await this.uploadMedia(buffer);

       // 3. Check processing status
       await this.checkMediaStatus(mediaId);

       return mediaId;
     }
   }
   ```

2. **Cloudinary Integration**
   ```typescript
   private async optimizeImage(imageUrl: string): Promise<string> {
     const result = await cloudinary.uploader.upload(imageUrl, {
       folder: 'twitter',
       transformation: [
         { width: 1200 },
         { height: 675 },
         { crop: 'fill' },
         { quality: 'auto:good' }
       ]
     });
     return result.secure_url;
   }
   ```

### Common Issues & Solutions

1. **Large File Handling**
   - **Problem**: Timeouts with large media uploads
   - **Solution**: Implement chunked upload
   ```typescript
   async uploadLargeMedia(buffer: Buffer): Promise<string> {
     // 1. INIT
     const init = await this.client.v1.uploadMedia(buffer, {
       command: 'INIT',
       total_bytes: buffer.length
     });
     // 2. APPEND chunks
     // 3. FINALIZE
   }
   ```

2. **Media Processing Timeouts**
   - **Problem**: Media processing taking too long
   - **Solution**: Implement status checking with retry
   ```typescript
   private async checkMediaStatus(mediaId: string): Promise<void> {
     let attempts = 0;
     while (attempts < maxAttempts) {
       const status = await this.client.v1.mediaStatus(mediaId);
       if (status.processing_info?.state === 'succeeded') return;
       await new Promise(resolve => setTimeout(resolve, delay));
       attempts++;
     }
   }
   ```

### Best Practices

1. **Media Optimization**
   - Use Cloudinary's auto-optimization
   - Implement proper error handling
   - Validate media before upload
   - Use chunked upload for large files

2. **Status Monitoring**
   - Implement proper timeout handling
   - Add detailed logging
   - Monitor processing status
   - Handle failures gracefully

## Future Considerations (Phase 7)

1. **User Authentication**
   - Prepare OAuth flow implementation
   - Consider token storage strategy
   - Plan permission scopes

2. **Multi-Account Support**
   - Design token management system
   - Plan database schema
   - Consider rate limiting per user

3. **Error Recovery**
   - Implement retry mechanisms
   - Add queue system for failed tweets
   - Consider fallback options

## Troubleshooting Guide

1. **HTTP 500 Error**
   - Check Twitter credentials
   - Verify ngrok URLs in Twitter Developer Portal
   - Ensure image URL is accessible
   - Check image size (< 5MB)

2. **Authentication Failed**
   - Verify all environment variables
   - Check API key permissions
   - Ensure tokens are not expired
   - Verify app settings in Developer Portal

3. **Media Upload Failed**
   - Use correct API version (v1.1)
   - Use `mimeType` not `type`
   - Verify image format (JPEG/PNG)
   - Check file size

4. **Tweet Creation Failed**
   - Use v2 endpoint
   - Verify text length (≤ 280 chars)
   - Check media_ids format
   - Verify API access level

## References

1. [Twitter API Documentation](https://developer.twitter.com/en/docs)
2. [Media Upload Guide](https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/overview)
3. [Tweet Creation Guide](https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets)
4. [API Access Levels](https://developer.twitter.com/en/products/twitter-api)

---

This document should be updated as new phases are implemented or when significant changes are made to the Twitter integration. 