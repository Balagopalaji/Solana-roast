# Twitter API Integration Guide - Complete Implementation

## Initial Setup
1. Create Twitter Developer Account
2. Create an App in the Developer Portal
3. Set app permissions to "Read and write"
4. Set app type to "Web App, Automated App or Bot"
5. Configure OAuth settings and callback URLs

## Project Structure
```
packages/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   └── twitter.service.ts    # Main Twitter integration
│   │   ├── routes/
│   │   │   └── api/
│   │   │       └── twitter.ts        # API endpoints
│   │   └── app.ts                    # Express setup
│   └── .env                          # Backend environment variables
└── frontend/
    ├── src/
    │   ├── services/
    │   │   ├── api.service.ts        # API client
    │   │   └── twitter-media.service.ts  # Frontend Twitter service
    │   └── components/
    │       └── roast/
    │           └── RoastDisplay.tsx   # UI component
    └── .env.development              # Frontend environment variables
```

## Environment Configuration
### Backend (.env)
```env
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
```

### Frontend (.env.development)
```env
VITE_API_URL=your_api_url
VITE_ENABLE_TWITTER=true
VITE_TWITTER_CALLBACK_URL=your_callback_url
```

## Implementation

### 1. Twitter Service (Backend)
```typescript
// twitter.service.ts
export class TwitterService {
  private client: TwitterApi | null = null;
  private initialized = false;

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      this.client = new TwitterApi({
        appKey: environment.twitter.apiKey!,
        appSecret: environment.twitter.apiSecret!,
        accessToken: environment.twitter.accessToken!,
        accessSecret: environment.twitter.accessSecret!
      });

      this.initialized = true;
      return true;
    } catch (error) {
      logger.error('Twitter service initialization failed:', error);
      return false;
    }
  }

  async uploadImageAndTweet(imageBuffer: Buffer, text: string, url: string): Promise<string> {
    if (!this.client) throw new Error('Twitter service not initialized');

    try {
      // 1. Size validation
      if (imageBuffer.length > 5 * 1024 * 1024) {
        throw new Error('Image too large. Maximum size is 5MB');
      }

      // 2. Upload media using v1.1
      const mediaId = await this.client.v1.uploadMedia(imageBuffer, {
        mimeType: 'image/jpeg'
      });

      // 3. Create tweet using v2
      const tweetText = `${text}\n\nRoast your wallet at ${url} 🔥`.substring(0, 280);
      const tweet = await this.client.v2.tweet({
        text: tweetText,
        media: {
          media_ids: [mediaId]
        }
      });

      return tweet.data.id;
    } catch (error) {
      // Error handling with specific codes
      const twitterError = error as TwitterApiError;
      if (twitterError.data?.errors?.[0]?.code === 453) {
        throw new Error('Twitter API access level insufficient. Please upgrade to Basic tier.');
      }
      throw error;
    }
  }
}
```

### 2. API Routes (Backend)
```typescript
// twitter.ts
router.post('/tweet', async (req, res) => {
  try {
    const { imageUrl, text, url } = req.body;
    
    // Download image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Post tweet
    const tweetId = await twitterService.uploadImageAndTweet(
      imageBuffer,
      text || '🔥',
      url
    );

    return res.json({ 
      success: true,
      tweetId 
    });
  } catch (error) {
    logger.error('Error posting tweet:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to post tweet',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});
```

### 3. Frontend Integration
```typescript
// twitter-media.service.ts
export class TwitterMediaService {
  async shareMedia(options: TwitterShareOptions): Promise<string> {
    return this.withRetry(async () => {
      try {
        const uploadResponse = await this.apiClient.post('/api/twitter/tweet', {
          imageUrl: options.imageUrl,
          text: options.text,
          url: options.url
        });

        if (uploadResponse.success && uploadResponse.tweetId) {
          return `https://twitter.com/i/status/${uploadResponse.tweetId}`;
        }

        return this.buildTweetUrl(options); // Fallback to web intent
      } catch (error) {
        logger.error('Failed to share via API:', error);
        return this.buildTweetUrl(options);
      }
    });
  }
}
```

## Key Points to Remember

1. **API Version Usage**:
   - Media Upload: Use v1.1 endpoint
   - Tweet Creation: Use v2 endpoint
   - Basic tier required for tweet creation

2. **Media Upload Requirements**:
   - Use `mimeType` not `type`
   - Max size: 5MB
   - Supported formats: JPEG, PNG
   - Buffer conversion required

3. **Error Handling**:
   - Check for error 453 (API access level)
   - Handle media upload separately
   - Provide fallback to web intent
   - Log detailed error information

4. **Rate Limiting**:
   - Implement retry mechanism
   - Track API usage
   - Handle rate limit errors

5. **Testing**:
   - Test media upload separately
   - Verify API access levels
   - Check error scenarios
   - Validate response formats

## Common Issues & Solutions

1. **Error 453**:
   - Cause: Insufficient API access level
   - Solution: Upgrade to Basic tier

2. **Media Upload Fails**:
   - Cause: Wrong mime type parameter
   - Solution: Use `mimeType` instead of `type`

3. **Tweet Creation Fails**:
   - Cause: Using v1 instead of v2
   - Solution: Use v2 endpoint with correct payload format

4. **Authentication Issues**:
   - Cause: Invalid tokens or permissions
   - Solution: Regenerate tokens after permission changes

## Useful Links
- [Twitter API Documentation](https://developer.twitter.com/en/docs)
- [Media Upload Guide](https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/overview)
- [Tweet Creation Guide](https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets)
- [API Access Levels](https://developer.twitter.com/en/products/twitter-api) 