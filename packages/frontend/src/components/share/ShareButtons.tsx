import { useState } from 'react';
import { Button } from '@react95/core';
import { shareService } from '../../services/share.service';
import { metrics } from '../../services/metrics.service';

interface ShareButtonsProps {
  roastText: string;
  url?: string;
}

export function ShareButtons({ roastText, url }: ShareButtonsProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleShare = async (type: 'native' | 'twitter' | 'clipboard') => {
    try {
      metrics.trackEvent({
        category: 'share',
        action: 'click',
        label: type
      });

      // Use screenshot for social sharing
      if (type === 'twitter' || type === 'native') {
        setIsCapturing(true);
        await shareService.shareWithScreenshot({
          text: roastText,
          url,
          type
        });
      } else {
        // Use regular sharing for clipboard
        await shareService.shareRoast({
          text: roastText,
          url,
          type
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="share-buttons flex gap-2">
      <Button 
        onClick={() => handleShare('native')}
        disabled={isCapturing}
      >
        {isCapturing ? '📸 Capturing...' : '💾 Save Meme'}
      </Button>

      <Button
        onClick={() => handleShare('clipboard')}
        disabled={isCapturing}
      >
        📋 Copy
      </Button>

      <Button
        onClick={() => handleShare('twitter')}
        disabled={isCapturing}
      >
        {isCapturing ? '📸 Capturing...' : '🐦 Tweet'}
      </Button>

      {isCapturing && (
        <div className="capture-overlay">
          <div className="capture-message">
            Capturing your roast...
          </div>
        </div>
      )}

      <style jsx>{`
        .share-buttons {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }
        .capture-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(192, 192, 192, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .capture-message {
          background: #fff;
          border: 2px solid #000;
          padding: 16px;
          font-family: "Microsoft Sans Serif";
        }
      `}</style>
    </div>
  );
} 