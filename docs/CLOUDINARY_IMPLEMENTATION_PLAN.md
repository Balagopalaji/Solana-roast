# Cloudinary Implementation Plan (Updated)

## Overview
Integration plan for Cloudinary service with Twitter media upload support.

## Current Architecture

```typescript
interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  maxFileSizeMB: number;
  allowedFormats: string[];
  folder: string;
}

interface UploadResponse {
  secure_url: string;
  public_id: string;
}

class CloudinaryService {
  private config: CloudinaryConfig;
  private uploadCount: number = 0;
  private lastUploadReset: number = Date.now();

  constructor(config: Partial<CloudinaryConfig>);
  async uploadImage(file: Blob): Promise<string>;
  private checkRateLimit(): void;
  getTwitterOptimizedUrl(url: string): string;
}
```

## Required Updates

### 1. Enhanced Configuration
```typescript
interface CloudinaryTwitterConfig extends CloudinaryConfig {
  twitter: {
    maxFileSize: number;  // 5MB limit
    dimensions: {
      width: number;      // 1200px
      height: number;     // 675px
    };
    allowedFormats: string[]; // ['png', 'jpg', 'jpeg']
  };
}
```

### 2. Retry Mechanism
```typescript
interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
}

class CloudinaryService {
  private async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = defaultRetryOptions
  ): Promise<T>;
}
```

### 3. Twitter-Specific Methods
```typescript
interface TwitterImageOptions {
  optimize: boolean;
  validate: boolean;
}

class CloudinaryService {
  async prepareForTwitter(
    url: string, 
    options: TwitterImageOptions = { optimize: true, validate: true }
  ): Promise<Blob>;

  validateTwitterRequirements(blob: Blob): Promise<boolean>;
}
```

### 4. Monitoring
```typescript
interface CloudinaryMetrics {
  uploads: {
    total: number;
    twitter: number;
    failures: number;
  };
  transformations: {
    total: number;
    twitter: number;
  };
  bandwidth: {
    total: number;
    twitter: number;
  };
}

class CloudinaryMonitor {
  trackUpload(size: number, type: 'standard' | 'twitter'): void;
  trackFailure(error: Error): void;
  getMetrics(): CloudinaryMetrics;
}
```

## Implementation Steps

### Phase 1: Core Updates
1. Add retry mechanism
2. Implement Twitter image validation
3. Add monitoring foundation
4. Update error handling

### Phase 2: Twitter Integration
1. Add Twitter-specific transformations
2. Implement size and format validation
3. Add Twitter metadata support
4. Update URL optimization

### Phase 3: Monitoring & Testing
1. Implement metrics tracking
2. Add performance monitoring
3. Create comprehensive tests
4. Add error reporting

## Testing Strategy

### 1. Unit Tests
```typescript
describe('CloudinaryService', () => {
  describe('Twitter Integration', () => {
    it('validates Twitter requirements correctly');
    it('optimizes images for Twitter');
    it('handles retry logic properly');
    it('tracks metrics accurately');
  });
});
```

### 2. Integration Tests
- End-to-end upload flow
- Twitter optimization pipeline
- Error handling scenarios
- Rate limit handling

### 3. Performance Tests
- Upload speed benchmarks
- Transformation timing
- Memory usage monitoring
- Bandwidth tracking

## Error Handling
1. Specific error types
2. Retry strategies
3. Fallback mechanisms
4. Error reporting

## Monitoring Plan
1. Track upload metrics
2. Monitor transformations
3. Track API usage
4. Alert on failures

## API References
- [Cloudinary Upload API](https://cloudinary.com/documentation/upload_images)
- [Twitter Media Requirements](https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/uploading-media/media-best-practices)
- [Cloudinary Transformations](https://cloudinary.com/documentation/image_transformations)

## Implementation Prompts

### Prompt 1: Core Service Enhancement
"Act as the senior full stack engineer. Enhance CloudinaryService with retry logic and Twitter validation. Refer to @Codebase for existing implementation. Keep changes modular and backwards compatible."

### Prompt 2: Monitoring Implementation
"Act as the senior full stack engineer. Implement CloudinaryMonitor for tracking uploads and transformations. Integrate with existing metrics service. Ensure minimal performance impact."

### Prompt 3: Testing Suite
"Act as the senior full stack engineer. Create comprehensive test suite for CloudinaryService. Include Twitter-specific tests. Ensure proper error case coverage."

## Next Steps
1. Review current implementation
2. Implement retry mechanism
3. Add Twitter validation
4. Set up monitoring
5. Update tests
6. Deploy with feature flags

Would you like to:
1. Start with the retry mechanism?
2. Focus on Twitter validation?
3. Begin with monitoring?
4. Something else? 