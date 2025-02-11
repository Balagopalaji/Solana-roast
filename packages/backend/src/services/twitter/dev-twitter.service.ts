import { TwitterApi } from 'twitter-api-v2';
import { BaseTwitterService, TwitterServiceConfig, TwitterApiError, TwitterServiceStatus } from './base-twitter.service';
import { environment } from '../../config/environment';
import logger from '../../utils/logger';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export class DevTwitterService extends BaseTwitterService {
  private retryCount: number = 0;
  private lastError: Error | null = null;

  constructor(config?: TwitterServiceConfig) {
    super(config);
  }

  protected async initializeClient(): Promise<void> {
    try {
      const { apiKey, apiSecret, accessToken, accessSecret } = environment.twitter;
      
      if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Missing Twitter API credentials in development mode', {
            hasApiKey: !!apiKey,
            hasApiSecret: !!apiSecret,
            hasAccessToken: !!accessToken,
            hasAccessSecret: !!accessSecret
          });
          logger.warn('Please set the following environment variables:');
          logger.warn('- TWITTER_API_KEY');
          logger.warn('- TWITTER_API_SECRET');
          logger.warn('- TWITTER_ACCESS_TOKEN');
          logger.warn('- TWITTER_ACCESS_SECRET');
          return;
        }
        logger.error('Missing Twitter API credentials', {
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret,
          hasAccessToken: !!accessToken,
          hasAccessSecret: !!accessSecret
        });
        throw new Error('Missing Twitter API credentials');
      }

      this.client = new TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken: accessToken,
        accessSecret: accessSecret,
      });

      // In development mode, skip permissions check until ngrok is ready
      if (process.env.NODE_ENV === 'development') {
        this.initialized = true;
        logger.info('Dev Twitter client initialized in development mode');
        logger.info('⚠️  Important: After ngrok starts, you must:');
        logger.info('1. Copy the ngrok URL from the console');
        logger.info('2. Update Twitter Developer Portal (https://developer.twitter.com/en/portal/dashboard):');
        logger.info('   - Website URL: https://{ngrok-id}.ngrok-free.app');
        logger.info('   - Callback URL: https://{ngrok-id}.ngrok-free.app/api/twitter/callback');
        logger.info('3. Restart the server after updating the URLs');
        return;
      }

      // Verify credentials and permissions in production
      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        throw new Error('Twitter API access denied. Please check app permissions.');
      }

      this.initialized = true;
      this.retryCount = 0;
      this.lastError = null;
      logger.info('Dev Twitter client initialized successfully');
    } catch (error) {
      this.initialized = false;
      this.lastError = error as Error;
      logger.error('Failed to initialize dev Twitter client:', error);
      throw error;
    }
  }

  public async getStatus(): Promise<TwitterServiceStatus & { 
    retryCount: number;
    lastError: string | null;
    canRetry: boolean;
  }> {
    const baseStatus = await super.getStatus();
    
    return {
      ...baseStatus,
      retryCount: this.retryCount,
      lastError: this.lastError?.message || null,
      canRetry: this.retryCount < MAX_RETRIES
    };
  }

  private async retryWithDelay(fn: () => Promise<any>, context: string): Promise<any> {
    try {
      return await fn();
    } catch (error) {
      const twitterError = error as TwitterApiError;
      
      // Don't retry on certain errors
      if (twitterError.code === 401) { // Unauthorized
        throw new Error('Twitter authentication failed. Please check API credentials.');
      }
      if (twitterError.code === 403) { // Forbidden
        throw new Error('Twitter permission denied. Please check app permissions in Twitter Developer Portal.');
      }
      if (twitterError.data?.errors?.[0]?.code === 453) { // API access level
        throw new Error('Twitter API access level insufficient. Please upgrade to Basic tier.');
      }

      // Retry on rate limits or temporary errors
      if (this.retryCount < MAX_RETRIES && (
          twitterError.code === 429 || // Rate limit
          twitterError.code === 500 || // Server error
          twitterError.code === 503    // Service unavailable
      )) {
        this.retryCount++;
        logger.warn(`${context} failed, retrying (${this.retryCount}/${MAX_RETRIES})...`, {
          error: twitterError.message,
          code: twitterError.code
        });

        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * this.retryCount));
        return this.retryWithDelay(fn, context);
      }

      throw error;
    }
  }

  public async shareWithMedia(text: string, imageUrl: string, walletAddress: string): Promise<string> {
    if (!this.client) {
      throw new Error('Twitter service not initialized');
    }

    try {
      // Emit share started event
      this.emitShareStarted(walletAddress, 'dev');

      logger.debug('Starting tweet with media', { text, imageUrl });

      // Download image with retry
      const imageResponse = await this.retryWithDelay(
        async () => {
          const response = await fetch(imageUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          return response;
        },
        'Image download'
      );

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      
      // Simple size validation (5MB limit)
      if (imageBuffer.length > 5 * 1024 * 1024) {
        throw new Error('Image too large. Maximum size is 5MB');
      }

      logger.debug('Image downloaded', { 
        size: imageBuffer.length,
        contentType: imageResponse.headers.get('content-type')
      });

      // Upload media with retry - simplified parameters
      const mediaId = await this.retryWithDelay(
        async () => this.client!.v1.uploadMedia(imageBuffer, {
          mimeType: 'image/jpeg' // Simplified to always use JPEG
        }),
        'Media upload'
      );

      logger.debug('Media upload successful', { mediaId });

      // Create tweet with media using v2 endpoint
      const tweetText = `${text}\n\nRoast your wallet at ${environment.appUrl} 🔥`.substring(0, 280);
      
      logger.debug('Attempting to post tweet', {
        text: tweetText,
        mediaId
      });

      // Post tweet with retry
      const tweet = await this.retryWithDelay(
        async () => this.client!.v2.tweet({
          text: tweetText,
          media: {
            media_ids: [mediaId]
          }
        }),
        'Tweet creation'
      );

      const tweetUrl = `https://twitter.com/i/web/status/${tweet.data.id}`;
      
      logger.info('Tweet posted successfully', { 
        tweetId: tweet.data.id,
        mediaId,
        tweetUrl
      });

      // Reset retry count on success
      this.retryCount = 0;
      this.lastError = null;

      // Emit share completed event
      this.emitShareCompleted(walletAddress, tweetUrl, 'dev');

      return tweetUrl;

    } catch (error) {
      const twitterError = error as TwitterApiError;
      logger.error('Twitter share error:', {
        error: twitterError.message,
        code: twitterError.code,
        data: twitterError.data,
        stack: twitterError.stack,
        retryCount: this.retryCount
      });

      // Store last error
      this.lastError = twitterError;

      // Emit share failed event
      this.emitShareFailed(walletAddress, twitterError.message, 'dev');

      // Handle specific error codes
      if (twitterError.code === 401) {
        throw new Error('Twitter authentication failed. Please check API credentials.');
      }
      if (twitterError.code === 403) {
        if (twitterError.data?.errors?.[0]?.code === 453) {
          throw new Error('Twitter API access level insufficient. Please upgrade to Basic tier.');
        }
        throw new Error('Twitter permission denied. Please check app permissions in Twitter Developer Portal.');
      }
      
      throw new Error(`Failed to post tweet: ${twitterError.message}`);
    }
  }
} 