import { firebaseService } from './firebase.service';
import logger from '../utils/logger';

interface ShareOptions {
  roastText: string;
  memeUrl: string;
  walletAddress: string;
}

class ShareService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'https://solanaroast.lol';
  }

  async createShareableLink(options: ShareOptions): Promise<string> {
    try {
      // Store in Firebase and get ID
      const shareId = await firebaseService.storeRoast({
        roast: options.roastText,
        memeUrl: options.memeUrl,
        walletAddress: options.walletAddress
      });

      // Generate shareable URL
      return `${this.baseUrl}/share/${shareId}`;
    } catch (error) {
      logger.error('Failed to create shareable link:', error);
      throw error;
    }
  }

  async getShareDetails(shareId: string) {
    return firebaseService.getRoast(shareId);
  }
}

export const shareService = new ShareService(); 