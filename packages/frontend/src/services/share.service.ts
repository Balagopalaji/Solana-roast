import { RoastResponse } from '../types/roast';
import { metrics } from './metrics.service';
import { AppError, ErrorCategory } from '../types/errors';
import { screenshotService } from './screenshot.service';

export interface ShareConfig {
  baseUrl: string;
  twitterHandle: string;
  defaultHashtags: string[];
  methods: {
    twitter: boolean;
    clipboard: boolean;
    download: boolean;
    screenshot?: boolean;
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
  imageBlob?: Blob;
  imageUrl?: string;
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
    const { text, url, title = 'My Solana Wallet Roast', type = 'native' } = options;
    
    try {
      metrics.trackEvent({
        category: 'share',
        action: 'start',
        label: type
      });

      let result: ShareResult;

      switch (type) {
        case 'native':
          result = await this.nativeShare({ text, url, title });
          break;
        case 'twitter':
          result = await this.twitterShare({ text, url });
          break;
        default:
          result = await this.clipboardShare(text);
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
      const appError = this.wrapError(error);
      
      metrics.trackError({
        error: appError,
        context: 'share_service',
        metadata: { type }
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
      return this.clipboardShare(options.text);
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

  private async clipboardShare(text: string): Promise<ShareResult> {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: 'clipboard' };
    } catch (error) {
      throw new Error('Failed to copy to clipboard');
    }
  }

  private async twitterShare({ text, url }: ShareOptions): Promise<ShareResult> {
    try {
      const tweetText = encodeURIComponent(text);
      const tweetUrl = url ? `&url=${encodeURIComponent(url)}` : '';
      const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}${tweetUrl}`;
      
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
      return { success: true, method: 'twitter' };
    } catch (error) {
      throw new Error('Failed to open Twitter share');
    }
  }

  async generateShareImage(roastData: RoastResponse): Promise<string> {
    // Implementation for generating shareable image
    // This will be used for social media sharing
    // TODO: Implement image generation
    return '';
  }

  async shareWithScreenshot(options: ShareOptions): Promise<ShareResult> {
    try {
      const roastElement = document.querySelector('.roast-container');
      if (!roastElement) {
        throw new Error('Roast element not found');
      }

      const screenshot = await screenshotService.captureElement({
        element: roastElement as HTMLElement,
        includeWatermark: true
      });

      // For Twitter, we'll use the blob
      if (options.type === 'twitter') {
        return this.twitterShare({
          ...options,
          imageBlob: screenshot.blob
        });
      }

      // For native share, we'll use the dataUrl
      return this.nativeShare({
        ...options,
        imageUrl: screenshot.dataUrl
      });
    } catch (error) {
      // Use existing error handling
      const appError = this.wrapError(error);
      metrics.trackError({
        error: appError,
        context: 'share_service',
        metadata: { type: options.type }
      });

      return {
        success: false,
        method: 'failed',
        error: new Error(this.getFriendlyErrorMessage(appError))
      };
    }
  }
}

export const shareService = ShareService.getInstance(); 