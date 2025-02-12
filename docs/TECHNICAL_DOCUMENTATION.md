# Solana Roast - Technical Documentation

## Table of Contents
1. [Application Overview](#1-application-overview)
2. [Architecture](#2-architecture)
3. [Twitter Integration](#3-twitter-integration)
4. [Redis Infrastructure](#4-redis-infrastructure)
5. [Development Setup](#5-development-setup)
6. [Deployment Process](#6-deployment-process)
7. [API Documentation](#7-api-documentation)
8. [References](#8-references)

## 1. Application Overview

### Purpose
Solana Roast is a web application that generates humorous "roasts" for Solana wallet addresses, combining AI-generated text with meme images, and allows sharing on social media platforms.

### Core Features
- Wallet analysis and roast generation
- Meme generation with text overlay
- Social media sharing (Twitter integration)
- Image optimization and processing
- Cross-platform compatibility

### Tech Stack
- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express
- Image Processing: Cloudinary, ImgFlip API
- AI: OpenAI API
- Social: Twitter API
- Development Tools: ngrok (development environment)

## 2. Architecture

### Project Structure
```
packages/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── twitter.service.ts
│   │   │   └── cloudinary.service.ts
│   │   ├── routes/
│   │   │   └── api/
│   │   │       └── twitter.ts
│   │   └── app.ts
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── roast/
    │   │       └── RoastDisplay.tsx
    │   ├── services/
    │   │   ├── social-share.service.ts
    │   │   └── twitter-media.service.ts
    │   └── app.tsx
    └── package.json
```

### Data Flow
1. User inputs Solana wallet address
2. Backend analyzes wallet and generates roast using OpenAI
3. ImgFlip API generates meme with roast text
4. Cloudinary optimizes image
5. User can share via Twitter integration

## 3. Twitter Integration

### Authentication Flow
```typescript
class TwitterService {
  private client: TwitterApi;
  
  constructor() {
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET
    });
  }
}
```

### Image Processing Pipeline
1. **ImgFlip Generation**
   ```typescript
   // Generate meme with text
   const meme = await imgflipService.generateMeme({
     template_id: templateId,
     text: roastText
   });
   ```

2. **Cloudinary Optimization**
   ```typescript
   const optimizedImage = await cloudinary.uploader.upload(imgflipUrl, {
     folder: 'solana-roast',
     transformation: [
       { quality: 'auto:good' },
       { fetch_format: 'auto' },
       { width: 'auto' },
       { dpr: 'auto' }
     ]
   });
   ```

3. **Twitter Upload**
   ```typescript
   const mediaId = await this.client.v1.uploadMedia(imageBuffer, {
     mimeType: 'image/jpeg'
   });
   ```

### Share Implementation
```typescript
async shareToTwitter({ text, url, imageUrl }) {
  // Download and process image
  const imageBuffer = await downloadAndProcessImage(imageUrl);
  
  // Upload and tweet
  const tweetId = await twitterService.uploadImageAndTweet(
    imageBuffer,
    text,
    url
  );
  
  return { success: true, tweetId };
}
```

## 4. Redis Infrastructure

### Architecture Overview
```typescript
// Base Redis service with connection pooling
class RedisService extends EventEmitter {
  private clients: Map<string, Redis>;
  private metrics: RedisMetrics;

  async getClient(name: string = 'default', config?: RedisConfig): Promise<Redis> {
    // Connection pooling implementation
    // Health monitoring
    // Metrics collection
  }
}

// Type-safe storage implementation
class RedisStorage<T> extends BaseStorageService<T> {
  private redis: Redis;
  protected prefix: string;
  protected ttl?: number;

  async set(key: string, value: T): Promise<void> {
    // Type-safe operations
    // Error handling
    // Metrics tracking
  }
}

// Monitoring service
class RedisMonitorService extends EventEmitter {
  private config: MonitorConfig;
  private metrics: RedisMetrics;

  start(): void {
    // Health checks
    // Metrics collection
    // Alert emission
  }
}
```

### Key Components

1. **Connection Management**
   - Connection pooling with configurable size
   - Automatic retries with backoff
   - TLS support for production
   - Health checks and monitoring

2. **Storage System**
   - Type-safe operations
   - Prefix namespacing
   - TTL support
   - Error handling
   - Metrics tracking

3. **Monitoring System**
   - Real-time metrics collection
   - Memory usage tracking
   - Operation latency monitoring
   - Error rate tracking
   - Alert system

### Configuration

#### Development
```env
REDIS_URL=redis://localhost:6379
REDIS_MAX_RETRIES=3
REDIS_HEALTH_CHECK_INTERVAL=30000
REDIS_CONNECTION_TIMEOUT=5000
REDIS_MAX_POOL_SIZE=20
```

#### Production
```env
REDIS_URL=rediss://your-production-redis-url
REDIS_PASSWORD=your-production-redis-password
REDIS_TLS=true
REDIS_MAX_RETRIES=5
REDIS_HEALTH_CHECK_INTERVAL=15000
REDIS_CONNECTION_TIMEOUT=3000
REDIS_MAX_POOL_SIZE=50

# Monitoring
REDIS_MONITOR_ENABLED=true
REDIS_MONITOR_INTERVAL=60000
REDIS_ALERT_THRESHOLD_MEMORY=80
REDIS_ALERT_THRESHOLD_LATENCY=100
REDIS_ALERT_THRESHOLD_ERRORS=10
```

### Best Practices

1. **Connection Management**
   - Use connection pooling for efficiency
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

### Implementation Order and Dependencies

1. **Core Services**
   - Implement `RedisService` base functionality first
   - Add connection management and health checks
   - Implement basic operations (get/set)

2. **Extended Features**
   - Add TTL support (`expire` method)
   - Implement type-safe storage operations
   - Add monitoring and metrics

3. **Common Pitfalls**
   - Always implement low-level Redis operations before higher-level features
   - Ensure proper serialization of stored data
   - Complete all abstract method implementations
   - Test Redis connection before server startup

4. **Testing Considerations**
   - Mock Redis client in tests
   - Test connection management
   - Verify type safety
   - Check error handling
   - Validate TTL functionality

### Common Issues & Solutions

1. **Connection Issues**
   ```typescript
   // Implement retry strategy
   const client = new Redis({
     retryStrategy: (times) => Math.min(times * 50, 2000)
   });
   ```

2. **Memory Management**
   ```typescript
   // Monitor memory usage
   const info = await client.info('memory');
   const usedMemory = info.match(/used_memory:(\d+)/);
   ```

3. **Performance Issues**
   ```typescript
   // Track operation latency
   const startTime = Date.now();
   await operation();
   const latency = Date.now() - startTime;
   ```

4. **Type Safety with Generic Storage**
   ```typescript
   // Problem: Generic type T in RedisStorage<T> can lead to linting errors
   class RedisStorage<T> extends BaseStorageService<T> {
     async set(key: string, value: T): Promise<void>;
   }

   // Solution: Create explicit type definitions
   // types/roast.types.ts
   interface StoredRoastResponse {
     roast: string;
     meme_url: string;
     wallet: WalletData;
     timestamp: number;
   }

   // services/storage/roast.storage.ts
   class RoastStorage extends RedisStorage<StoredRoastResponse> {
     // TypeScript now has full type information
     async set(key: string, value: StoredRoastResponse): Promise<void>;
   }
   ```

   Key points:
   - Keep type definitions in separate `.types.ts` files
   - Use explicit interfaces for stored data structures
   - Consider data serialization format in type definitions
   - Document date/time handling (ISO strings vs. Date objects)

### References

1. **Internal Documentation**
   - [Redis Service](packages/backend/src/services/storage/redis.service.ts)
   - [Redis Storage](packages/backend/src/services/storage/redis.storage.ts)
   - [Redis Monitor](packages/backend/src/services/monitoring/redis-monitor.service.ts)

2. **External Documentation**
   - [Redis Documentation](https://redis.io/documentation)
   - [IORedis Documentation](https://github.com/luin/ioredis)

## Redis Implementation

### Testing Infrastructure
The Redis service implementation includes a comprehensive test suite with the following features:

1. **Mock Implementation**
```typescript
// Proper EventEmitter-based mock
class MockRedisBase extends EventEmitter {
  constructor() {
    super();
  }
}

// Type-safe mock creation
const createMockRedisClient = () => {
  const base = new MockRedisBase();
  const mockClient = {
    ...base,
    // Redis operations
  };
  return mockClient as jest.Mocked<Redis>;
};
```

2. **Test Coverage**
- Connection management
- Event handling
- Metrics collection
- Basic operations (get/set/delete)
- Sorted sets (leaderboard)
- Hash operations (analytics)
- Transaction handling

3. **Error Handling**
- Operation failures
- Invalid data
- Connection issues
- Metrics tracking

4. **Event System**
- Connection events
- Error events
- Metric updates
- State management

### Usage in Tests
```typescript
import { mockRedisClient } from '../tests/mocks/ioredis';

describe('RedisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisService = RedisService.getInstance();
  });

  it('should handle operations', async () => {
    mockRedisClient.get.mockResolvedValueOnce('value');
    const result = await redisService.get('key');
    expect(result).toBe('value');
  });
});
```

## 5. Development Setup

### Local Environment
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start Redis:
   ```bash
   # Start Redis service
   npm run dev:services:start

   # Check Redis status
   redis-cli ping
   ```

3. Set up ngrok:
   ```bash
   npm run dev:persistent  # Starts persistent ngrok tunnel
   ```

4. Start development servers:
   ```bash
   npm run dev
   ```

5. Managing Services:
   ```bash
   # Start Redis
   npm run dev:services:start

   # Stop Redis
   npm run dev:services:stop

   # Check service status
   npm run dev:check

   # Stop all development services (Redis + ngrok)
   STOP_REDIS=true npm run dev:services:stop && npm run ngrok:cleanup
   ```

### Redis Development Notes
- Redis runs as a system service via Homebrew
- Service stays running between development sessions
- Manually start/stop for better control
- Check status with `redis-cli ping`
- Monitor with built-in Redis monitoring service
- **Important**: Always start Redis BEFORE running `npm run dev`
  ```bash
  # Correct order:
  npm run dev:services:start  # Start Redis first
  redis-cli ping             # Verify Redis is running
  npm run dev               # Then start development servers
  ```
  Starting Redis after the development servers are running will cause connection errors

### Twitter Developer Portal Setup
1. Create app at developer.twitter.com
2. Set permissions to "Read and write"
3. Configure OAuth settings:
   - Development URL: `https://[ngrok-id].ngrok.io`
   - Callback URL: `https://[ngrok-id].ngrok.io/api/twitter/callback`

### Ngrok Management

#### Primary Method: Persistent Tunnel
```bash
# Start ngrok as a persistent process
nohup ngrok http 5173 &

# View the assigned URL
curl http://localhost:4040/api/tunnels
```

#### Fallback Method
If the ngrok tunnel stops (computer sleep/shutdown):
1. Restart ngrok manually
2. The `.env.development` will auto-update with new URL
3. Restart the development server

#### Best Practices
1. Check tunnel status before development:
   ```bash
   curl http://localhost:4040/api/tunnels
   ```
2. If tunnel is down:
   - Start new tunnel
   - Wait for `.env.development` update
   - Restart server
3. Keep Twitter Developer Portal open during development
4. If URLs mismatch, update callback URLs manually

### Development Methods

1. **Standard Development** (recommended)
   ```bash
   npm run dev:ngrok
   ```
   - Most reliable method
   - Starts ngrok and dev server together
   - Auto-restarts both when needed
   - Updates `.env.development` automatically
   - Best for most development scenarios

2. **Basic Development** (without ngrok)
   ```bash
   npm run dev
   ```
   - Starts only the development servers
   - Use when Twitter integration isn't needed
   - Fastest startup time
   - No ngrok overhead

3. **Persistent Development** (experimental)
   ```bash
   # First, start ngrok separately:
   ngrok http 5173

   # In a new terminal, once ngrok is running:
   npm run check:ngrok
   npm run dev
   ```
   - Manual but more controlled approach
   - Better for long development sessions
   - Keeps ngrok running independently
   - More reliable than automatic persistent mode

#### Common Development Issues

1. **If `dev:persistent` fails**:
   ```bash
   # Clean up first
   npm run ngrok:cleanup

   # Then use either:
   npm run dev:ngrok   # Recommended approach
   # OR
   ngrok http 5173    # Manual approach in one terminal
   npm run dev        # Then run this in another terminal
   ```

2. **If ngrok isn't detected**:
   ```bash
   # Check if ngrok is running
   npm run ngrok:status

   # If not running, start it manually
   ngrok http 5173

   # Once running, update environment
   npm run check:ngrok
   ```

3. **If URLs are mismatched**:
   ```bash
   # Update .env.development with current ngrok URL
   npm run check:ngrok

   # Restart the development server
   npm run dev
   ```

#### Best Development Practices

1. **Recommended Workflow**
   - Start with `npm run dev:ngrok` for most development
   - Keep Twitter Developer Portal open
   - Monitor the console for ngrok URL changes
   - Use `npm run check:ngrok` if URLs get out of sync

2. **For Longer Sessions**
   - Run ngrok manually: `ngrok http 5173`
   - Keep the ngrok terminal open
   - Run development server separately
   - Monitor both terminals for issues

3. **Troubleshooting Steps**
   - Always run `ngrok:cleanup` before switching methods
   - Check ngrok status if Twitter features aren't working
   - Verify URLs in Twitter Developer Portal
   - Restart servers if URLs change

#### Utility Commands
```bash
# Check ngrok status
npm run ngrok:status

# Update .env.development with current ngrok URL
npm run check:ngrok

# Stop ngrok processes
npm run ngrok:cleanup
```

#### Development to Production Transition

1. **Pre-Deployment Checks**
   ```bash
   npm run check:production
   ```
   This will verify:
   - No development-only files present
   - No running ngrok processes
   - All production environment variables set
   - No development URLs in configuration

2. **Cleanup Steps**
   ```bash
   # Stop ngrok processes
   npm run ngrok:cleanup

   # Remove development environment file
   rm packages/frontend/.env.development
   ```

3. **Environment Updates**
   - Update Twitter Developer Portal:
     * Remove ngrok callback URLs
     * Set production callback URL: `https://solanaroast.lol/api/twitter/callback`
     * Update website URL: `https://solanaroast.lol`
   
   - Verify production environment variables:
     ```env
     NODE_ENV=production
     APP_URL=https://solanaroast.lol
     CORS_ORIGIN=https://solanaroast.lol
     # ... other production variables
     ```

4. **Deployment**
   ```bash
   # Will automatically run cleanup and checks
   npm run deploy
   ```

#### Troubleshooting

1. **Development Issues**
   - If ngrok tunnel stops (computer sleep/shutdown):
     ```bash
     npm run ngrok:cleanup    # Clean up any zombie processes
     npm run dev:persistent   # Restart development environment
     ```
   
   - If URLs are mismatched:
     ```bash
     npm run check:ngrok      # Update .env.development
     # Restart development server
     ```

2. **Production Transition Issues**
   - If production checks fail:
     * Review the error messages
     * Fix environment variables
     * Ensure ngrok is stopped
     * Remove development artifacts
     * Rerun `npm run check:production`

   - If Twitter callbacks fail:
     * Verify Twitter Developer Portal settings
     * Check SSL certificates
     * Validate production URLs

#### Best Practices

1. **Development**
   - Use `dev:persistent` for longer sessions
   - Use `dev:ngrok` for frequent restarts
   - Keep Twitter Developer Portal open during development
   - Monitor ngrok status with `npm run ngrok:status`

2. **Production**
   - Always run `check:production` before deployment
   - Verify Twitter settings after URL changes
   - Keep `.env.development` in .gitignore
   - Use production-specific environment variables

3. **Monitoring**
   - Watch for ngrok connection issues
   - Monitor Twitter API rate limits
   - Check callback URL validity
   - Verify environment variables

## 6. Deployment Process

### Pre-deployment Checklist
1. Update Twitter credentials
2. Configure production URLs
3. Set up monitoring
4. Enable production logging

### Production Configuration
```typescript
// environment.ts
export const environment = {
  production: {
    twitter: {
      callbackUrl: 'https://solanaroast.lol/api/twitter/callback',
      // Other production settings
    }
  }
};
```

## 7. API Documentation

### Twitter Endpoints
```typescript
// POST /api/twitter/tweet
interface TweetRequest {
  text: string;
  imageUrl: string;
  url: string;
}

interface TweetResponse {
  success: boolean;
  tweetId?: string;
  error?: string;
}
```

### Image Processing Endpoints
```typescript
// POST /api/image/optimize
interface OptimizeRequest {
  imageUrl: string;
  options?: CloudinaryOptions;
}

interface OptimizeResponse {
  success: boolean;
  optimizedUrl: string;
}
```

## 8. References

### Official Documentation
- [Twitter API Documentation](https://developer.twitter.com/en/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [ImgFlip API](https://api.imgflip.com/)

### Internal Documentation
- [Twitter Integration Plan](docs/TWITTER_INTEGRATION_PLAN.md)
- [Twitter Deployment Checklist](docs/TWITTER_DEPLOYMENT_CHECKLIST.md)
- [Twitter API Analysis](docs/TWITTER_API_ANALYSIS.md)

### Code References
- Frontend Components:
  - [RoastDisplay.tsx](packages/frontend/src/components/roast/RoastDisplay.tsx)
  - [TwitterShare.tsx](packages/frontend/src/components/twitter/TwitterShare.tsx)

- Backend Services:
  - [twitter.service.ts](packages/backend/src/services/twitter.service.ts)
  - [cloudinary.service.ts](packages/backend/src/services/cloudinary.service.ts)

### Error Codes and Handling
```typescript
const ERROR_CODES = {
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  MEDIA_UPLOAD_FAILED: 'Media upload failed',
  INVALID_IMAGE_FORMAT: 'Invalid image format',
  SIZE_LIMIT_EXCEEDED: 'Image size exceeds 5MB limit'
};
```

### Best Practices
1. Image Optimization
   - Use Cloudinary's auto-optimization
   - Validate size before upload
   - Handle format conversion

2. Error Handling
   - Implement retries for rate limits
   - Provide fallback sharing methods
   - Clear user feedback

3. Security
   - Secure credential storage
   - Rate limiting
   - Input validation

### Monitoring and Maintenance
1. Regular Tasks
   - Token rotation
   - Rate limit monitoring
   - Error log analysis

2. Health Checks
   - API endpoint status
   - Image processing pipeline
   - Authentication flow

---

This documentation provides a comprehensive overview of the application's architecture, implementation details, and maintenance requirements. For specific implementation details, refer to the linked code files and official documentation. 