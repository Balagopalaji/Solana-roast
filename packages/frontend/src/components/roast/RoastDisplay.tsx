import React, { useCallback, useState, useEffect } from 'react';
import { RoastResponse } from '../../types/roast';
import { Toast } from '../common/Toast';
import { RoastMeme } from './RoastMeme';
import { downloadImage } from '../../utils/image';

interface RoastDisplayProps {
  roastData: RoastResponse | null;
  loading: boolean;
  error: string | null;
  onClose?: () => void;
  onMinimize?: () => void;
}

export const RoastDisplay: React.FC<RoastDisplayProps> = ({
  roastData,
  loading,
  error,
  onClose,
  onMinimize
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Show component when data arrives or loading starts
  useEffect(() => {
    if (loading || roastData || error) {
      setIsVisible(true);
    }
  }, [loading, roastData, error]);

  // Only hide when explicitly closed
  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || (!loading && !roastData && !error)) return null;

  const handleCopy = useCallback(async () => {
    if (!roastData?.roast) return;
    try {
      await navigator.clipboard.writeText(roastData.roast);
      setToastMessage('Roast copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      setToastMessage('Failed to copy roast');
    }
  }, [roastData?.roast]);

  const handleShare = useCallback(async () => {
    if (!roastData?.roast) return;
    try {
      await navigator.share({
        title: 'My Solana Wallet Roast',
        text: roastData.roast,
        url: window.location.href
      });
    } catch (err) {
      // Fallback to copy if share not supported
      handleCopy();
    }
  }, [roastData?.roast, handleCopy]);

  const handleDownload = async () => {
    if (!roastData?.meme_url) {
      setToastMessage('No meme available to download');
      return;
    }
    
    const filename = `solana-roast-${roastData.wallet?.address.slice(0, 8)}`;
    const success = await downloadImage(roastData.meme_url, { filename });
    setToastMessage(success ? 'Meme downloaded successfully! 🎉' : 'Failed to download meme');
  };

  const handleTwitterShare = async () => {
    if (!roastData?.roast) return;
    
    const tweetText = encodeURIComponent(roastData.roast);
    const url = encodeURIComponent(window.location.href);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${url}`;
    
    // Open Twitter in new window
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!roastData) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-win95-gray border-2 border-win95-gray-darker shadow-lg w-full max-w-2xl">
        {/* Window Title Bar */}
        <div className="flex items-center justify-between bg-win95-blue px-2 py-1">
          <span className="text-white font-bold">
            {loading ? '⌛ Generating Roast...' : '🔥 Your Roast Is Ready'}
          </span>
          <div className="flex gap-1">
            <button
              onClick={onMinimize}
              className="px-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in"
            >
              _
            </button>
            <button
              onClick={handleClose}
              className="px-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in"
            >
              X
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4">
          <div className="bg-win95-gray shadow-win95-out p-4">
            <p className="text-lg mb-4">{roastData.roast}</p>
            <RoastMeme roastData={roastData} />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button 
              onClick={handleDownload}
              className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in"
            >
              💾 Save Meme
            </button>
            <button 
              onClick={handleCopy}
              className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in"
            >
              📋 Copy
            </button>
            <button 
              onClick={handleShare}
              className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in"
            >
              📤 Share
            </button>
            <button 
              onClick={handleTwitterShare}
              className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in"
            >
              🐦 Tweet
            </button>
          </div>
        </div>
      </div>
      {toastMessage && (
        <Toast 
          message={toastMessage} 
          onClose={() => setToastMessage(null)} 
        />
      )}
    </div>
  );
}; 