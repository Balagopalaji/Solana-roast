import CloudinaryService from './cloudinary.service';
import { environment } from '../config/environment';
import { logger } from '../utils/logger';

interface TwitterShareOptions {
  text: string;
  url: string;
  image?: Blob;
}

interface TwitterShareResult {
  success: boolean;
  imageUrl?: string;
  error?: Error;
}

export class SocialShareService {
  private static instance: SocialShareService;
  private cloudinary?: CloudinaryService;

  private constructor() {
    if (environment.features.twitter) {
      try {
        this.cloudinary = new CloudinaryService();
      } catch (error) {
        logger.warn('Cloudinary initialization failed:', error);
      }
    }
  }

  static getInstance(): SocialShareService {
    if (!this.instance) {
      this.instance = new SocialShareService();
    }
    return this.instance;
  }

  async shareToTwitter(options: TwitterShareOptions): Promise<TwitterShareResult> {
    try {
      let imageUrl = '';
      
      if (options.image && this.cloudinary) {
        console.log('Uploading to Cloudinary...');
        imageUrl = await this.cloudinary.uploadImage(options.image);
        console.log('Cloudinary response:', imageUrl);
        imageUrl = this.cloudinary.getTwitterOptimizedUrl(imageUrl);
      }

      const tweetText = imageUrl 
        ? `${options.text}\n\n${imageUrl}` 
        : options.text;

      const twitterUrl = new URL('https://twitter.com/intent/tweet');
      twitterUrl.searchParams.append('text', tweetText);
      twitterUrl.searchParams.append('url', options.url);

      window.open(twitterUrl.toString(), '_blank');
      return { success: true, imageUrl };
    } catch (error) {
      logger.error('Twitter share failed:', error);
      return { 
        success: false,
        error: error instanceof Error ? error : new Error('Failed to share to Twitter')
      };
    }
  }
}

export const socialShareService = SocialShareService.getInstance(); 