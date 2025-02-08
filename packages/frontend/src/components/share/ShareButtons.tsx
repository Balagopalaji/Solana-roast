import { shareService } from '../../services/share.service';
import { metrics } from '../../services/metrics.service';

interface ShareButtonsProps {
  roastText: string;
  url?: string;
}

export function ShareButtons({ roastText, url }: ShareButtonsProps) {
  const handleShare = async (type: 'native' | 'twitter' | 'clipboard') => {
    try {
      metrics.trackEvent({
        category: 'share',
        action: 'click',
        label: type
      });

      await shareService.shareRoast({
        text: roastText,
        url,
        type
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <div className="flex gap-2 mt-4">
      <button 
        onClick={() => handleShare('native')}
        className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in"
      >
        💾 Save Meme
      </button>

      <button
        onClick={() => handleShare('clipboard')}
        className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in"
      >
        📋 Copy
      </button>

      <button
        onClick={() => handleShare('twitter')}
        className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in"
      >
        🐦 Tweet
      </button>
    </div>
  );
} 