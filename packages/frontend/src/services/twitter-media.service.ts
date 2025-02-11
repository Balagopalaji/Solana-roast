import { logger } from '../utils/logger';
import { ApiClient } from './api.service';

// Define TwitterShareOptions interface
export interface TwitterShareOptions {
  text: string;
  url: string;
  imageUrl?: string;
}

interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 5000   // 5 seconds
};

export class TwitterMediaService {
  private static instance: TwitterMediaService | null = null;
  private apiClient: ApiClient;
  
  private constructor() {
    this.apiClient = new ApiClient();
  }

  static getInstance(): TwitterMediaService {
    if (!this.instance) {
      this.instance = new TwitterMediaService();
    }
    return this.instance;
  }

  async shareMedia(options: TwitterShareOptions): Promise<string> {
    return this.withRetry(async () => {
      try {
        logger.debug('Starting share media process:', {
          hasText: !!options.text,
          hasUrl: !!options.url,
          hasImageUrl: !!options.imageUrl,
          apiUrl: this.apiClient.baseUrl
        });

        const uploadResponse = await this.apiClient.post('/api/twitter/tweet', {
          imageUrl: options.imageUrl,
          text: options.text,
          url: options.url
        });

        logger.debug('Upload response:', uploadResponse);

        if (uploadResponse.success && uploadResponse.tweetUrl) {
          logger.info('Successfully shared via API:', uploadResponse);
          return uploadResponse.tweetUrl;
        }

        logger.warn('API share failed, falling back to web intent', uploadResponse);
        return this.buildTweetUrl(options);
      } catch (error) {
        logger.error('Failed to share via API:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        return this.buildTweetUrl(options);
      }
    });
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = DEFAULT_RETRY_OPTIONS
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (!this.isRetryableError(error) || attempt === options.maxAttempts) {
          throw lastError;
        }

        const delay = Math.min(
          options.baseDelay * Math.pow(2, attempt - 1),
          options.maxDelay
        );

        logger.warn(
          `Retry attempt ${attempt}/${options.maxAttempts} after ${delay}ms:`,
          error
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Retry failed');
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Network errors, rate limits, and temporary service issues
      return (
        error.name === 'NetworkError' ||
        error.message.includes('rate limit') ||
        error.message.includes('timeout') ||
        error.message.includes('5') // 5xx errors
      );
    }
    return false;
  }

  private buildTweetUrl(options: TwitterShareOptions): string {
    const twitterUrl = new URL('https://twitter.com/intent/tweet');
    const tweetText = options.imageUrl 
      ? `${options.text}\n\n${options.imageUrl}` 
      : options.text;
    
    twitterUrl.searchParams.append('text', tweetText);
    twitterUrl.searchParams.append('url', options.url);

    return twitterUrl.toString();
  }
}

export const twitterMediaService = TwitterMediaService.getInstance(); 