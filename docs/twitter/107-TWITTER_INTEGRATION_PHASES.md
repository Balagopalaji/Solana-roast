# Twitter Integration Implementation Guide

## Overview

This document details the phased implementation of Twitter integration in the Solana Roast project, focusing on Phases 0 and 1. It serves as both a historical record and a troubleshooting guide for future development.

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