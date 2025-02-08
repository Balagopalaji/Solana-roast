import { cacheService } from './cache.service';
import logger from '../utils/logger';

interface ShareOptions {
  roastText: string;
  memeUrl: string;
  walletAddress: string;
}

interface ShareData {
  roast: string;
  memeUrl: string;
  walletAddress: string;
  createdAt: Date;
}

class ShareService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'https://solanaroast.lol';
  }

  async createShareableLink(options: ShareOptions): Promise<string> {
    try {
      // Generate a unique ID
      const shareId = crypto.randomUUID();
      
      // Store in cache
      const shareData: ShareData = {
        roast: options.roastText,
        memeUrl: options.memeUrl,
        walletAddress: options.walletAddress,
        createdAt: new Date()
      };
      
      cacheService.set(shareId, shareData, 24 * 60 * 60); // 24 hour TTL

      // Generate shareable URL
      return `${this.baseUrl}/share/${shareId}`;
    } catch (error) {
      logger.error('Failed to create shareable link:', error);
      throw error;
    }
  }

  async getShareDetails(shareId: string) {
    return cacheService.get<ShareData>(shareId);
  }
}

export const shareService = new ShareService(); 