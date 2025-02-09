import { metrics } from './metrics.service';
import { AppError, ErrorCategory } from '../types/errors';
import { clipboardService } from './clipboard.service';
import { logger } from '../utils/logger';

export interface ShareConfig {
  baseUrl: string;
  twitterHandle: string;
  defaultHashtags: string[];
  methods: {
    twitter: boolean;
    clipboard: boolean;
    download: boolean;
  };
  fallbacks: {
    primary: 'clipboard' | 'download';
    secondary: 'text' | 'link';
  };
}

export interface ShareOptions {
  text: string;
  url?: string;
  title?: string;
  type?: 'native' | 'twitter' | 'clipboard';
  image_url?: string;
}

export interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard' | 'twitter' | 'failed';
  error?: Error;
}

class ShareService {
  private static instance: ShareService;

  private constructor() {}

  static getInstance(): ShareService {
    if (!ShareService.instance) {
      ShareService.instance = new ShareService();
    }
    return ShareService.instance;
  }

  async shareRoast(options: ShareOptions): Promise<ShareResult> {
    try {
      metrics.trackEvent({
        category: 'share',
        action: 'start',
        label: options.type || 'native'
      });

      let result: ShareResult;

      switch (options.type) {
        case 'native':
          result = await this.nativeShare(options);
          break;
        case 'twitter':
          if (options.image_url) {
            try {
              result = await this.twitterShareWithMedia(options);
            } catch (error) {
              result = await this.twitterShare(options);
            }
          } else {
            result = await this.twitterShare(options);
          }
          break;
        case 'clipboard':
          result = await this.clipboardShare(options);
          break;
        default:
          result = await this.clipboardShare(options);
      }

      if (result.success) {
        metrics.trackEvent({
          category: 'share',
          action: 'success',
          label: result.method
        });
      }

      return result;
    } catch (error) {
      logger.error('Share failed:', error);
      const appError = this.wrapError(error);
      
      metrics.trackError({
        error: appError,
        context: 'share_service',
        metadata: { type: options.type || 'failed' }
      });

      // Return a user-friendly error result
      return {
        success: false,
        method: 'failed',
        error: new Error(this.getFriendlyErrorMessage(appError))
      };
    }
  }

  private getFriendlyErrorMessage(error: AppError): string {
    switch (error.metadata.category) {
      case ErrorCategory.NETWORK:
        return 'Network error. Please check your connection and try again.';
      case ErrorCategory.VALIDATION:
        return 'Share cancelled.';
      case ErrorCategory.RATE_LIMIT:
        return 'Too many attempts. Please wait a moment and try again.';
      default:
        return 'Failed to share. Try copying instead.';
    }
  }

  private wrapError(error: unknown): AppError {
    if (error instanceof AppError) return error;
    
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new AppError(message, {
      category: this.determineErrorCategory(error),
      retryable: this.isErrorRetryable(error),
      context: 'share_service'
    });
  }

  private determineErrorCategory(error: unknown): ErrorCategory {
    if (error instanceof Error) {
      if (error.name === 'AbortError') return ErrorCategory.VALIDATION;
      if (error.message.includes('network')) return ErrorCategory.NETWORK;
    }
    return ErrorCategory.UNKNOWN;
  }

  private isErrorRetryable(error: unknown): boolean {
    return error instanceof Error && 
           [ErrorCategory.NETWORK, ErrorCategory.TIMEOUT].includes(
             this.determineErrorCategory(error)
           );
  }

  private async nativeShare(options: ShareOptions): Promise<ShareResult> {
    if (!navigator.share) {
      return this.clipboardShare(options);
    }

    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url
      });

      return { success: true, method: 'native' };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return { 
          success: false, 
          method: 'native',
          error: new Error('Share cancelled by user')
        };
      }
      throw error;
    }
  }

  private async clipboardShare(options: ShareOptions): Promise<ShareResult> {
    try {
      if (!options.text || !options.image_url) {
        throw new Error('Text and image URL are required for clipboard sharing');
      }

      await clipboardService.copyToClipboard(options.text, options.image_url);
      return { success: true, method: 'clipboard' };
    } catch (error) {
      logger.error('Clipboard share failed:', error);
      return { 
        success: false, 
        method: 'clipboard',
        error: new Error('Failed to copy to clipboard')
      };
    }
  }

  private async twitterShare(options: ShareOptions): Promise<ShareResult> {
    try {
      const tweetText = encodeURIComponent(options.text);
      const tweetUrl = options.url ? `&url=${encodeURIComponent(options.url)}` : '';
      const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}${tweetUrl}`;
      
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
      return { success: true, method: 'twitter' };
    } catch (error) {
      throw new Error('Failed to open Twitter share');
    }
  }

  private async twitterShareWithMedia(options: ShareOptions): Promise<ShareResult> {
    try {
      const response = await fetch('/api/share/twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: options.text,
          image_url: options.image_url
        })
      });

      if (!response.ok) {
        throw new Error('Failed to share on Twitter');
      }

      return { success: true, method: 'twitter' };
    } catch (error) {
      throw new Error('Failed to share on Twitter with media');
    }
  }
}

export const shareService = ShareService.getInstance(); 