import { RoastResponse } from '../types/roast';

export interface ShareConfig {
  baseUrl: string;
  twitterHandle: string;
  defaultHashtags: string[];
}

export interface ShareOptions {
  roastData: RoastResponse;
  type: 'link' | 'twitter' | 'screenshot';
}

export interface ShareResult {
  success: boolean;
  url?: string;
  error?: string;
}

class ShareService {
  private config: ShareConfig;

  constructor() {
    this.config = {
      baseUrl: window.location.origin,
      twitterHandle: 'SolanaRoast',
      defaultHashtags: ['SolanaRoast', 'Solana']
    };
  }

  async shareLink(options: ShareOptions): Promise<ShareResult> {
    try {
      const shareUrl = this.generateShareUrl(options.roastData);
      await navigator.clipboard.writeText(shareUrl);
      
      return {
        success: true,
        url: shareUrl
      };
    } catch (error) {
      console.error('Share error:', error);
      return {
        success: false,
        error: 'Failed to copy share link'
      };
    }
  }

  private generateShareUrl(roastData: RoastResponse): string {
    const params = new URLSearchParams({
      wallet: roastData.wallet.address,
      timestamp: new Date().toISOString()
    });

    return `${this.config.baseUrl}/roast?${params.toString()}`;
  }
}

export const shareService = new ShareService(); 