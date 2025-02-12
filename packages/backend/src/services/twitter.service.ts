import { TwitterApi } from 'twitter-api-v2';
import sharp from 'sharp';
import logger from '../utils/logger';
import { environment } from '../config/environment';
import { devTwitterService } from './twitter';

interface MediaValidationOptions {
  maxSizeBytes: number;        // 5MB Twitter limit
  allowedTypes: string[];      // Allowed MIME types
  maxDimensions: {            // Reasonable dimensions for tweets
    width: number;
    height: number;
  };
  allowedDomains: string[]; // Add allowed domains
}

interface TwitterApiError extends Error {
  code?: number;
  data?: any;
  details?: string;
}

export class TwitterService {
  private static instance: TwitterService | null = null;
  private initialized = false;
  private client: TwitterApi | null = null;

  private readonly MEDIA_VALIDATION: MediaValidationOptions = {
    maxSizeBytes: 5 * 1024 * 1024,  // 5MB Twitter limit
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ],
    maxDimensions: {
      width: 4096,
      height: 4096
    },
    allowedDomains: [
      'res.cloudinary.com',      // Our Cloudinary domain
      'i.imgflip.com'           // Meme template source
    ]
  };

  private constructor() {
    // Don't verify immediately, wait for first use
    this.initializeClient();
  }

  public static getInstance(): TwitterService {
    if (!this.instance) {
      this.instance = new TwitterService();
    }
    return this.instance;
  }

  private initializeClient() {
    try {
      if (
        process.env.TWITTER_API_KEY &&
        process.env.TWITTER_API_SECRET &&
        process.env.TWITTER_ACCESS_TOKEN &&
        process.env.TWITTER_ACCESS_SECRET
      ) {
        this.client = new TwitterApi({
          appKey: process.env.TWITTER_API_KEY,
          appSecret: process.env.TWITTER_API_SECRET,
          accessToken: process.env.TWITTER_ACCESS_TOKEN,
          accessSecret: process.env.TWITTER_ACCESS_SECRET,
        });
        this.initialized = true;
        logger.info('Twitter client initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize Twitter client:', error);
    }
  }

  private async verifyCredentials() {
    if (!this.client) return;
    
    try {
      // Get user context
      const user = await this.client.v1.verifyCredentials();
      
      // Get app context
      const appContext = await this.client.v2.me();
      
      logger.info('Twitter credentials verified:', {
        username: user.screen_name,
        // Log what we know about the authenticated user
        accountInfo: {
          protected: user.protected,
          verified: user.verified,
          followersCount: user.followers_count
        },
        // Log app context
        appContext: {
          id: appContext.data.id,
          name: appContext.data.name,
          username: appContext.data.username
        }
      });

    } catch (error) {
      logger.error('Twitter credentials verification failed:', error);
      throw error;
    }
  }

  async testImageUpload(imageUrl: string): Promise<boolean> {
    if (!this.client) {
      logger.warn('Twitter client not initialized - Check API credentials');
      return false;
    }

    try {
      logger.info('Starting Twitter test upload with image:', imageUrl);
      
      // Download image from Cloudinary URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        logger.error('Failed to fetch image:', imageResponse.statusText);
        return false;
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      logger.info('Successfully downloaded image, size:', imageBuffer.byteLength);

      // Upload to Twitter using v1.1 endpoint
      const mediaId = await this.client.v1.uploadMedia(Buffer.from(imageBuffer), {
        mimeType: imageResponse.headers.get('content-type') || 'image/jpeg',
        target: 'tweet'
      });

      logger.info('Successfully uploaded image to Twitter', { 
        mediaId,
        size: imageBuffer.byteLength 
      });

      return true;
    } catch (error) {
      logger.error('Twitter test upload failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof Error && error.message.includes('403')) {
        logger.error('Permission error - Please check Twitter Developer Portal settings:');
        logger.error('1. Go to https://developer.twitter.com/en/portal/dashboard');
        logger.error('2. Select your app');
        logger.error('3. Go to "Settings" > "User authentication settings"');
        logger.error('4. Ensure "App permissions" is set to "Read and Write"');
        logger.error('5. Regenerate access tokens after changing permissions');
      }
      
      return false;
    }
  }

  async uploadImageAndTweet(imageBuffer: Buffer, text: string, url: string): Promise<string> {
    if (!this.client) throw new Error('Twitter service not initialized');

    try {
      // 1. Validate image size
      if (imageBuffer.length > 5 * 1024 * 1024) {
        throw new Error('Image too large. Maximum size is 5MB');
      }

      // 2. Upload media using v1.1 endpoint
      logger.debug('Starting media upload', { size: imageBuffer.length });
      const mediaId = await this.client.v1.uploadMedia(imageBuffer, {
        mimeType: 'image/jpeg'
      });

      logger.debug('Media upload successful', { mediaId });

      // 3. Create tweet using v2 endpoint
      const tweetText = `${text}\n\nRoast your wallet at ${url} 🔥`.substring(0, 280);
      
      logger.debug('Creating tweet with v2 endpoint', { mediaId, tweetText });
      const tweet = await this.client.v2.tweet({
        text: tweetText,
        media: {
          media_ids: [mediaId]
        }
      });

      logger.info('Tweet created successfully', { 
        tweetId: tweet.data.id,
        mediaId 
      });

      return tweet.data.id;

    } catch (error) {
      const twitterError = error as TwitterApiError;
      logger.error('Twitter API error:', {
        message: twitterError.message,
        code: twitterError.code,
        data: twitterError.data
      });

      // Specific handling for error 453
      if (twitterError.data?.errors?.[0]?.code === 453) {
        logger.error('Twitter API access level error. Please check:');
        logger.error('1. You have Basic tier or higher access');
        logger.error('2. Your app is approved for v1.1 endpoints');
        logger.error('3. Your tokens match the approved app');
        throw new Error('Twitter API access level insufficient. Please upgrade to Basic tier.');
      }

      throw error;
    }
  }

  isEnabled(): boolean {
    return !!this.client;
  }

  private async validateMedia(buffer: Buffer, contentType: string): Promise<void> {
    // 1. Size validation
    if (buffer.length > this.MEDIA_VALIDATION.maxSizeBytes) {
      throw new Error(`Image size ${buffer.length} bytes exceeds maximum allowed size of ${this.MEDIA_VALIDATION.maxSizeBytes} bytes`);
    }

    // 2. MIME type validation
    if (!this.MEDIA_VALIDATION.allowedTypes.includes(contentType)) {
      throw new Error(`Content type ${contentType} not allowed. Allowed types: ${this.MEDIA_VALIDATION.allowedTypes.join(', ')}`);
    }

    // 3. Image dimensions validation (using sharp)
    try {
      const metadata = await sharp(buffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Could not determine image dimensions');
      }

      if (metadata.width > this.MEDIA_VALIDATION.maxDimensions.width ||
          metadata.height > this.MEDIA_VALIDATION.maxDimensions.height) {
        throw new Error(`Image dimensions ${metadata.width}x${metadata.height} exceed maximum allowed dimensions ${this.MEDIA_VALIDATION.maxDimensions.width}x${this.MEDIA_VALIDATION.maxDimensions.height}`);
      }
    } catch (error) {
      throw new Error('Invalid image format or corrupted image file');
    }
  }

  private validateUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);
      if (!this.MEDIA_VALIDATION.allowedDomains.includes(parsedUrl.hostname)) {
        throw new Error(`Domain ${parsedUrl.hostname} not allowed. Allowed domains: ${this.MEDIA_VALIDATION.allowedDomains.join(', ')}`);
      }
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  async shareWithMedia(text: string, imageUrl: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('Twitter service not initialized');
    }

    try {
      logger.debug('Starting tweet with media', { text, imageUrl });

      // 1. Download image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }

      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      
      logger.debug('Image downloaded', { 
        size: imageBuffer.length,
        contentType 
      });

      // 2. Upload media first - with explicit type
      logger.debug('Starting media upload');
      const mediaId = await this.client.v1.uploadMedia(imageBuffer, {
        type: contentType,
        mimeType: contentType
      }).catch((error: TwitterApiError) => {
        logger.error('Media upload failed:', {
          error: error.message,
          code: error.code,
          details: error.data
        });
        throw error;
      });

      logger.debug('Media upload successful', { mediaId });

      // 3. Create tweet with media
      const tweetText = text.substring(0, 280); // Ensure text fits Twitter limit
      
      logger.debug('Attempting to post tweet', {
        text: tweetText,
        mediaId
      });

      const tweet = await this.client.v1.tweet(tweetText, {
        media_ids: [mediaId.toString()]
      }).catch((error: TwitterApiError) => {
        logger.error('Tweet creation failed:', {
          error: error.message,
          code: error.code,
          details: error.data
        });
        throw error;
      });

      logger.info('Tweet posted successfully', { 
        tweetId: tweet.id_str,
        mediaId
      });

      return true;

    } catch (error) {
      const twitterError = error as TwitterApiError;
      logger.error('Twitter share error:', {
        error: twitterError.message,
        code: twitterError.code,
        data: twitterError.data,
        stack: twitterError.stack,
        details: twitterError.details
      });

      if (twitterError.code === 401) {
        throw new Error('Twitter authentication failed. Please check API credentials.');
      }
      if (twitterError.code === 403) {
        throw new Error('Twitter permission denied. Please check app permissions in Twitter Developer Portal.');
      }
      
      throw new Error(`Failed to post tweet: ${twitterError.message}`);
    }
  }

  async postTweet(imageUrl: string): Promise<{ success: boolean; tweetId?: string }> {
    if (!this.client) {
      logger.warn('Twitter client not initialized');
      return { success: false };
    }

    try {
      // Download image from Cloudinary URL
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();

      // Upload to Twitter
      const mediaId = await this.client.v1.uploadMedia(Buffer.from(imageBuffer), {
        mimeType: imageResponse.headers.get('content-type') || 'image/jpeg'
      });

      // Post tweet with media
      const tweet = await this.client.v2.tweet({
        text: '🎨', // You might want to make this configurable
        media: { media_ids: [mediaId] }
      });

      logger.info('Successfully posted tweet with image', { 
        tweetId: tweet.data.id,
        mediaId 
      });

      return { 
        success: true,
        tweetId: tweet.data.id
      };
    } catch (error) {
      logger.error('Failed to post tweet:', error);
      return { success: false };
    }
  }

  public isInitialized(): boolean {
    return this.client !== null;
  }

  private async initializeOAuth() {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      logger.error('Missing Twitter OAuth credentials');
      return;
    }

    // Initialize OAuth client
    try {
      this.client = new TwitterApi({
        clientId,
        clientSecret
      });

      logger.info('Twitter OAuth client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Twitter OAuth client:', error);
    }
  }

  async getStatus(): Promise<{
    initialized: boolean;
    hasApiKey: boolean;
    hasApiSecret: boolean;
    hasAccessToken: boolean;
    hasAccessSecret: boolean;
    clientInitialized: boolean;
  }> {
    return {
      initialized: this.initialized,
      hasApiKey: !!process.env.TWITTER_API_KEY,
      hasApiSecret: !!process.env.TWITTER_API_SECRET,
      hasAccessToken: !!process.env.TWITTER_ACCESS_TOKEN,
      hasAccessSecret: !!process.env.TWITTER_ACCESS_SECRET,
      clientInitialized: !!this.client
    };
  }

  async checkPermissions(): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      // Try to verify credentials
      const result = await this.client.v1.verifyCredentials({
        skip_status: true // We don't need the user's tweets
      });

      logger.info('Twitter credentials verified:', {
        username: result.screen_name,
        id: result.id_str,
        protected: result.protected,
        verified: result.verified
      });

      // Check if we can post by testing media upload capability
      const testResult = await this.testImageUpload(
        'https://res.cloudinary.com/roast/image/upload/v1/roasts/test.jpg'
      );

      if (!testResult) {
        logger.error('Twitter write permissions test failed');
        return false;
      }

      logger.info('Twitter write permissions verified');
      return true;

    } catch (error) {
      const twitterError = error as TwitterApiError;
      logger.error('Twitter permission check failed:', {
        code: twitterError.code,
        message: twitterError.message,
        data: twitterError.data
      });

      if (twitterError.code === 403) {
        logger.error('Write permissions not granted. Please check Twitter Developer Portal settings:');
        logger.error('1. Go to https://developer.twitter.com/en/portal/dashboard');
        logger.error('2. Select your app');
        logger.error('3. Go to "Settings" > "User authentication settings"');
        logger.error('4. Ensure "App permissions" is set to "Read and write"');
        logger.error('5. Regenerate access tokens after changing permissions');
      }

      return false;
    }
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      this.client = new TwitterApi({
        appKey: environment.twitter.apiKey!,
        appSecret: environment.twitter.apiSecret!,
        accessToken: environment.twitter.accessToken!,
        accessSecret: environment.twitter.accessSecret!
      });

      // Add permission check
      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        throw new Error('Twitter API access denied. Please check app permissions.');
      }

      this.initialized = true;
      return true;
    } catch (error) {
      logger.error('Twitter service initialization failed:', error);
      return false;
    }
  }
}

// Re-export the dev Twitter service instance
export const twitterService = devTwitterService; 