import logger from '../utils/logger';

interface ShareOptions {
  text: string;
  url?: string;
  type: 'native' | 'twitter' | 'clipboard';
}

class ShareService {
  async shareRoast(options: ShareOptions): Promise<void> {
    try {
      switch (options.type) {
        case 'native':
          // Handle direct download
          return;
        case 'clipboard':
          await navigator.clipboard.writeText(options.text);
          return;
        case 'twitter':
          const tweetText = options.url 
            ? `${options.text}\n${options.url}`
            : options.text;
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`);
          return;
        default:
          throw new Error(`Unsupported share type: ${options.type}`);
      }
    } catch (error) {
      logger.error('Share failed:', error);
      throw error;
    }
  }
}

export const shareService = new ShareService(); 