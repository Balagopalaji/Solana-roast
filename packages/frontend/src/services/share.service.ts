import { logger } from '../utils/logger';
import { clipboardService } from './clipboard.service';
import { metrics } from './metrics.service';
import CloudinaryService from './cloudinary.service';
import { environment } from '../config/environment';

export type ShareMethod = 'native' | 'twitter' | 'clipboard' | 'failed';

export interface ShareOptions {
  text: string;
  url: string;
  image?: Blob;
  type: Exclude<ShareMethod, 'failed'>;
}

export interface ShareResult {
  success: boolean;
  method: ShareMethod;
  error?: Error;
  imageUrl?: string;
}

class ShareService {
  private static instance: ShareService;
  private cloudinary?: CloudinaryService;
  private abortController: AbortController | null = null;

  private constructor() {
    // Initialize Cloudinary with dependency injection support
    try {
      this.cloudinary = new CloudinaryService();
    } catch (error) {
      logger.warn('Cloudinary initialization failed:', error);
      // Service will work without Cloudinary for non-image shares
    }
  }

  static getInstance(): ShareService {
    if (!ShareService.instance) {
      ShareService.instance = new ShareService();
    }
    return ShareService.instance;
  }

  async shareRoast(options: ShareOptions): Promise<ShareResult> {
    try {
      // Track share attempt
      metrics.trackEvent({
        category: 'share',
        action: 'attempt',
        label: options.type
      });

      let result: ShareResult;

      switch (options.type) {
        case 'native':
          result = await this.nativeShare(options);
          break;
        case 'twitter':
          result = await this.twitterShare(options);
          break;
        case 'clipboard':
          result = await this.clipboardShare(options);
          break;
        default:
          logger.error('Invalid share type:', options.type);
          result = {
            success: false,
            method: 'failed',
            error: new Error('Invalid share type')
          };
      }

      // Track share result
      metrics.trackEvent({
        category: 'share',
        action: result.success ? 'success' : 'failure',
        label: result.method
      });

      return result;
    } catch (error) {
      logger.error('Share failed:', error);
      return {
        success: false,
        method: 'failed',
        error: error instanceof Error ? error : new Error('Share failed')
      };
    }
  }

  cancelUpload() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  private async nativeShare(options: ShareOptions): Promise<ShareResult> {
    if (!navigator.share) {
      return {
        success: false,
        method: 'failed',
        error: new Error('Native sharing not supported')
      };
    }

    try {
      // Create a rich text version that includes everything
      const richText = `${options.text}\n\nShare this roast: ${options.url}`;

      if (options.image && typeof navigator.canShare === 'function') {
        const file = new File([options.image], 'roast-meme.png', {
          type: 'image/png'
        });

        // Try sharing with both text and file
        const fullShareData = {
          title: 'My Solana Wallet Roast 🔥',
          text: richText,
          url: options.url,
          files: [file]
        };

        // First attempt: Try sharing everything
        if (navigator.canShare(fullShareData)) {
          try {
            await navigator.share(fullShareData);
            return { success: true, method: 'native' };
          } catch (error) {
            console.log('Full share failed, trying fallback...', error);
          }
        }

        // Second attempt: Try sharing just the image with text
        const imageWithTextData = {
          title: 'My Solana Wallet Roast 🔥',
          text: richText,
          files: [file]
        };

        if (navigator.canShare(imageWithTextData)) {
          try {
            await navigator.share(imageWithTextData);
            return { success: true, method: 'native' };
          } catch (error) {
            console.log('Image with text share failed, trying text only...', error);
          }
        }
      }

      // Final fallback: Share text only
      const textOnlyData = {
        title: 'My Solana Wallet Roast 🔥',
        text: richText,
        url: options.url
      };

      await navigator.share(textOnlyData);
      return { success: true, method: 'native' };

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return {
          success: false,
          method: 'failed',
          error: new Error('Share cancelled')
        };
      }
      throw error;
    }
  }

  private async clipboardShare(options: ShareOptions): Promise<ShareResult> {
    try {
      if (!options.text) {
        throw new Error('Text is required for clipboard sharing');
      }

      if (options.image) {
        const imageUrl = URL.createObjectURL(options.image);
        await clipboardService.copyToClipboard(options.text, imageUrl);
        URL.revokeObjectURL(imageUrl);
      } else {
        await navigator.clipboard.writeText(options.text);
      }

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
      let imageUrl = '';
      
      // Upload image to Cloudinary if available
      if (options.image && this.cloudinary && environment.features.twitter) {
        try {
          imageUrl = await this.uploadWithRetry(options.image);
          imageUrl = this.cloudinary.getTwitterOptimizedUrl(imageUrl);
        } catch (error) {
          logger.warn('Image upload failed, falling back to text-only share:', error);
        }
      }

      const tweetText = encodeURIComponent(options.text);
      const tweetUrl = options.url ? `&url=${encodeURIComponent(options.url)}` : '';
      const imageParam = imageUrl ? `&image=${encodeURIComponent(imageUrl)}` : '';
      const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}${tweetUrl}${imageParam}`;
      
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
      return { 
        success: true, 
        method: 'twitter',
        imageUrl 
      };
    } catch (error) {
      logger.error('Twitter share failed:', error);
      return {
        success: false,
        method: 'failed',
        error: new Error('Failed to open Twitter share')
      };
    }
  }

  private async uploadWithRetry(blob: Blob, retries = 3): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.cloudinary!.uploadImage(blob);
      } catch (error) {
        if (attempt === retries) throw error;
        logger.warn(`Upload attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    throw new Error('Upload failed after retries');
  }
}

export const shareService = ShareService.getInstance(); 