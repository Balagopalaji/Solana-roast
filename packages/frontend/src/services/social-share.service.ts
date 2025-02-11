import { logger } from '../utils/logger';
import { ApiClient } from './api.service';

interface TwitterShareOptions {
  text: string;
  url: string;
  imageUrl?: string;
}

interface TwitterShareResult {
  success: boolean;
  error?: string;
  url?: string;
}

export class SocialShareService {
  private static instance: SocialShareService;
  private apiClient: ApiClient;

  private constructor() {
    this.apiClient = new ApiClient();
  }

  static getInstance(): SocialShareService {
    if (!this.instance) {
      this.instance = new SocialShareService();
    }
    return this.instance;
  }

  async shareToTwitter(options: TwitterShareOptions): Promise<TwitterShareResult> {
    try {
      logger.debug('Sharing to Twitter:', options);
      
      const result = await this.apiClient.post('/api/twitter/tweet', {
        text: options.text,
        url: options.url,
        imageUrl: options.imageUrl
      });

      return result;
    } catch (error) {
      logger.error('Twitter share failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to share to Twitter'
      };
    }
  }
}

export const socialShareService = SocialShareService.getInstance(); 