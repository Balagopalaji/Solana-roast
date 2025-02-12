import { TwitterApi } from 'twitter-api-v2';
import sharp from 'sharp';
import logger from '../../utils/logger';
import { environment } from '../../config/environment';
import { EventBusService } from '../events/event-bus.service';
import { EventType, TwitterAuthEvent, TwitterShareEvent } from '../events/events.types';

export interface TwitterApiError extends Error {
  code?: number;
  data?: any;
  details?: string;
}

export interface MediaValidationOptions {
  maxSizeBytes: number;
  allowedTypes: string[];
  maxDimensions: {
    width: number;
    height: number;
  };
  allowedDomains: string[];
}

export interface TwitterServiceConfig {
  eventBus?: EventBusService;
  mediaValidation?: Partial<MediaValidationOptions>;
}

export interface TwitterServiceStatus {
  initialized: boolean;
  hasApiKey: boolean;
  hasApiSecret: boolean;
  hasAccessToken: boolean;
  hasAccessSecret: boolean;
  clientInitialized: boolean;
}

export abstract class BaseTwitterService {
  protected client: TwitterApi | null = null;
  protected initialized = false;
  protected eventBus?: EventBusService;

  protected readonly MEDIA_VALIDATION: MediaValidationOptions = {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB Twitter limit
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
      'res.cloudinary.com',
      'i.imgflip.com'
    ]
  };

  constructor(config?: TwitterServiceConfig) {
    if (config?.eventBus) {
      this.eventBus = config.eventBus;
    }
    if (config?.mediaValidation) {
      this.MEDIA_VALIDATION = {
        ...this.MEDIA_VALIDATION,
        ...config.mediaValidation
      };
    }
  }

  protected abstract initializeClient(): Promise<void>;

  public async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      await this.initializeClient();
      
      if (process.env.NODE_ENV === 'development') {
        logger.info('Development mode: Twitter service initialization');
        logger.info('⚠️  Important: After ngrok starts, you must:');
        logger.info('1. Copy the ngrok URL from the console');
        logger.info('2. Update Twitter Developer Portal (https://developer.twitter.com/en/portal/dashboard):');
        logger.info('   - Website URL: https://{ngrok-id}.ngrok-free.app');
        logger.info('   - Callback URL: https://{ngrok-id}.ngrok-free.app/api/twitter/callback');
        logger.info('3. Restart the server after updating the URLs');
        
        // In development, we'll initialize without strict checks
        this.initialized = true;
        return true;
      }

      // In production, we'll do strict permission checking
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

  public async checkPermissions(): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      // Verify credentials
      const result = await this.client.v1.verifyCredentials({
        skip_status: true
      });

      logger.info('Twitter credentials verified:', {
        username: result.screen_name,
        id: result.id_str,
        protected: result.protected,
        verified: result.verified
      });

      // Skip media upload test in development
      if (process.env.NODE_ENV === 'development') {
        logger.info('Skipping media upload test in development');
        return true;
      }

      // Test media upload capability
      const testResult = await this.testImageUpload(
        'https://res.cloudinary.com/roast/image/upload/v1/test/test-image.jpg'
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

  protected async validateMedia(buffer: Buffer, contentType: string): Promise<void> {
    // Size validation
    if (buffer.length > this.MEDIA_VALIDATION.maxSizeBytes) {
      throw new Error(`Image size ${buffer.length} bytes exceeds maximum allowed size of ${this.MEDIA_VALIDATION.maxSizeBytes} bytes`);
    }

    // MIME type validation
    if (!this.MEDIA_VALIDATION.allowedTypes.includes(contentType)) {
      throw new Error(`Content type ${contentType} not allowed. Allowed types: ${this.MEDIA_VALIDATION.allowedTypes.join(', ')}`);
    }

    // Image dimensions validation
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

  protected validateUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);
      if (!this.MEDIA_VALIDATION.allowedDomains.includes(parsedUrl.hostname)) {
        throw new Error(`Domain ${parsedUrl.hostname} not allowed. Allowed domains: ${this.MEDIA_VALIDATION.allowedDomains.join(', ')}`);
      }
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  public async testImageUpload(imageUrl: string): Promise<boolean> {
    if (!this.client) {
      logger.warn('Twitter client not initialized - Check API credentials');
      return false;
    }

    try {
      logger.info('Starting Twitter test upload with image:', imageUrl);
      
      // Download image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        logger.error('Failed to fetch image:', imageResponse.statusText);
        return false;
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      logger.info('Successfully downloaded image, size:', imageBuffer.byteLength);

      // Upload to Twitter
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
        logger.error('Permission error - Please check Twitter Developer Portal settings');
      }
      
      return false;
    }
  }

  protected emitShareStarted(walletAddress: string, shareMethod: 'dev' | 'user'): void {
    if (!this.eventBus) return;

    const event: TwitterShareEvent = {
      type: EventType.TWITTER_SHARE_STARTED,
      payload: {
        walletAddress,
        timestamp: Date.now(),
        shareMethod
      },
      source: 'twitter_service',
      timestamp: Date.now()
    };

    this.eventBus.publishEvent(event);
  }

  protected emitShareCompleted(walletAddress: string, tweetUrl: string, shareMethod: 'dev' | 'user'): void {
    if (!this.eventBus) return;

    const event: TwitterShareEvent = {
      type: EventType.TWITTER_SHARE_COMPLETED,
      payload: {
        walletAddress,
        tweetUrl,
        timestamp: Date.now(),
        shareMethod
      },
      source: 'twitter_service',
      timestamp: Date.now()
    };

    this.eventBus.publishEvent(event);
  }

  protected emitShareFailed(walletAddress: string, error: string, shareMethod: 'dev' | 'user'): void {
    if (!this.eventBus) return;

    const event: TwitterShareEvent = {
      type: EventType.TWITTER_SHARE_FAILED,
      payload: {
        walletAddress,
        error,
        timestamp: Date.now(),
        shareMethod
      },
      source: 'twitter_service',
      timestamp: Date.now()
    };

    this.eventBus.publishEvent(event);
  }

  public isInitialized(): boolean {
    return this.initialized && this.client !== null;
  }

  public async getStatus(): Promise<{
    initialized: boolean;
    hasApiKey: boolean;
    hasApiSecret: boolean;
    hasAccessToken: boolean;
    hasAccessSecret: boolean;
    clientInitialized: boolean;
  }> {
    return {
      initialized: this.initialized,
      hasApiKey: !!environment.twitter.apiKey,
      hasApiSecret: !!environment.twitter.apiSecret,
      hasAccessToken: !!environment.twitter.accessToken,
      hasAccessSecret: !!environment.twitter.accessSecret,
      clientInitialized: !!this.client
    };
  }
} 