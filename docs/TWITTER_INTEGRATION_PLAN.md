# Twitter Media Integration Implementation

## Architecture

### 1. Service Layer
```typescript
// services/twitter-media.service.ts
interface TwitterMediaUploadResponse {
  media_id: string;
  expires_after_secs: number;
}

interface TwitterMediaStatus {
  state: 'pending' | 'in_progress' | 'failed' | 'succeeded';
  progress_percent?: number;
  error?: {
    code: number;
    message: string;
  };
}

class TwitterMediaService {
  private static CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  private static MAX_RETRIES = 3;
  private static BASE_DELAY = 1000; // 1 second

  async uploadMedia(imageUrl: string): Promise<string> {
    // 1. Get image from Cloudinary
    const imageData = await this.fetchImageFromCloudinary(imageUrl);
    
    // 2. Initialize upload
    const { media_id } = await this.initUpload(imageData.size, imageData.type);
    
    // 3. Upload chunks if needed
    if (imageData.size > this.CHUNK_SIZE) {
      await this.uploadChunks(media_id, imageData);
    } else {
      await this.uploadSingle(media_id, imageData);
    }
    
    // 4. Finalize and wait for processing
    await this.finalizeUpload(media_id);
    await this.waitForProcessing(media_id);
    
    return media_id;
  }
}
```

### 2. Integration Layer
```typescript
// services/share.service.ts
class ShareService {
  private twitterMedia: TwitterMediaService;
  
  async shareToTwitter(options: ShareOptions): Promise<ShareResult> {
    try {
      let mediaId: string | undefined;
      
      if (options.imageUrl) {
        mediaId = await this.twitterMedia.uploadMedia(options.imageUrl);
      }
      
      const tweetParams = new URLSearchParams({
        text: options.text,
        url: options.url
      });
      
      if (mediaId) {
        tweetParams.append('media_ids', mediaId);
      }
      
      window.open(
        `https://twitter.com/intent/tweet?${tweetParams.toString()}`,
        '_blank'
      );
      
      return { success: true };
    } catch (error) {
      // Fallback to text-only tweet
      return this.fallbackShare(options);
    }
  }
}
```

## Error Handling Strategy

1. **Network Errors**
```typescript
private async withRetry<T>(
  operation: () => Promise<T>,
  retries = this.MAX_RETRIES
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === retries) throw error;
      
      const delay = this.BASE_DELAY * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry failed');
}
```

2. **API Errors**
```typescript
private handleApiError(error: any): never {
  if (error.response?.status === 429) {
    throw new RateLimitError('Twitter API rate limit exceeded');
  }
  
  throw new TwitterApiError(
    error.response?.data?.error || 'Twitter API error',
    error.response?.status
  );
}
```

## Testing Plan

1. **Unit Tests**
```typescript
describe('TwitterMediaService', () => {
  describe('uploadMedia', () => {
    it('handles large files with chunked upload', async () => {
      // Test implementation
    });
    
    it('retries on network failure', async () => {
      // Test implementation
    });
    
    it('respects rate limits', async () => {
      // Test implementation
    });
  });
});
```

2. **Integration Tests**
```typescript
describe('ShareService Twitter Integration', () => {
  it('successfully uploads and shares media', async () => {
    // Test implementation
  });
  
  it('falls back to text-only on error', async () => {
    // Test implementation
  });
});
```

## API References
- [Media Upload API](https://developer.x.com/en/docs/x-api/v1/media/upload-media/api-reference/post-media-upload)
- [Media Best Practices](https://developer.x.com/en/docs/x-api/v1/media/upload-media/uploading-media/media-best-practices)
- [Upload Tutorial](https://developer.x.com/en/docs/tutorials/uploading-media)
- [Media Metadata](https://developer.x.com/en/docs/x-api/v1/media/upload-media/api-reference/post-media-metadata-create)
- [Upload INIT](https://developer.x.com/en/docs/x-api/v1/media/upload-media/api-reference/post-media-upload-init)

## Next Steps
1. Implement TwitterMediaService
2. Add authentication handling
3. Set up rate limiting
4. Add monitoring
5. Implement fallback strategies

Would you like me to:
1. Start with the TwitterMediaService implementation?
2. Focus on the authentication setup?
3. Create the error handling utilities?
4. Something else? 