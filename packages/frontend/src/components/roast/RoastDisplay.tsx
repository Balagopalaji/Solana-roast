import React, { useCallback, useState, useEffect } from 'react';
import { RoastResponse } from '../../types/roast';
import { Toast } from '../common/Toast';
import { RoastMeme } from './RoastMeme';
import { downloadImage } from '../../utils/image';
import { metrics } from '../../services/metrics.service';
import { shareService } from '../../services/share.service';
import { metadataService } from '../../services/metadata.service';
import { clipboardService } from '../../services/clipboard.service';
import { environment } from '../../config/environment';
import { logger } from '../../utils/logger';
import { socialShareService } from '../../services/social-share.service';

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
  // Define all hooks at the top level unconditionally
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isCopying, setIsCopying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Add feature flag check
  const isTwitterEnabled = environment.features?.twitter ?? false;

  // Add loading state for Twitter share
  const [isTwitterSharing, setIsTwitterSharing] = useState(false);
  const [twitterShareError, setTwitterShareError] = useState<string | null>(null);

  useEffect(() => {
    metrics.initialize();

    // Update metadata when roast is loaded
    if (roastData) {
      metadataService.updateMetadata({
        title: 'My Solana Wallet Roast 🔥',
        description: roastData.roast,
        image: roastData.meme_url,
        url: window.location.href
      });
    }

    return () => {
      metadataService.resetMetadata();
    };
  }, [roastData]);

  useEffect(() => {
    if (roastData?.meme_url) {
      console.log('RoastDisplay: Meme URL received:', roastData.meme_url); // Debug log
    }
  }, [roastData]);

  useEffect(() => {
    if (roastData) {
      console.log('Full roast response:', roastData); // Debug full response
      console.log('Meme URL:', roastData.meme_url);
    }
  }, [roastData]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    onClose?.();
  }, [onClose]);

  const handleShare = useCallback(async () => {
    if (!roastData?.roast || !roastData?.meme_url) return;
    
    setIsSharing(true);
    try {
      // First get the PNG blob using our existing service
      const response = await fetch(roastData.meme_url);
      const blob = await response.blob();
      const pngBlob = await clipboardService.convertToPng(blob);

      // Try native sharing first
      const result = await shareService.shareRoast({
        text: roastData.roast,
        url: window.location.href,
        image: pngBlob,
        type: 'native'
      });

      if (result.success) {
        setToastMessage('Shared successfully! 🎉');
      } else if (result.error?.message.includes('cancelled')) {
        // Don't show error for user cancellations
        return;
      } else {
        // Try clipboard fallback with URL
        const imageUrl = roastData.meme_url; // Use URL for clipboard
        await clipboardService.copyToClipboard(roastData.roast, imageUrl);
        setToastMessage('Shared to clipboard instead!');
      }
    } catch (error) {
      console.error('Share failed:', error);
      setToastMessage('Failed to share. Try copying instead.');
    } finally {
      setIsSharing(false);
    }
  }, [roastData?.roast, roastData?.meme_url]);

  const handleDownload = useCallback(async () => {
    if (!roastData?.meme_url) {
      setToastMessage('No meme available to download');
      return;
    }
    
    const filename = `solana-roast-${roastData.wallet?.address.slice(0, 8)}`;
    const success = await downloadImage(roastData.meme_url, { filename });
    setToastMessage(success ? 'Meme downloaded successfully! 🎉' : 'Failed to download meme');
  }, [roastData?.meme_url, roastData?.wallet?.address]);

  const handleTwitterShare = async () => {
    if (!roastData?.roast || !roastData?.meme_url) {
      setTwitterShareError('No roast or meme available to share');
      return;
    }

    setIsTwitterSharing(true);
    setTwitterShareError(null);

    try {
      logger.debug('Starting Twitter share', {
        hasRoastData: !!roastData,
        hasRoastText: !!roastData.roast,
        hasMemeUrl: !!roastData.meme_url
      });

      // Let the backend handle the Cloudinary optimization
      const result = await socialShareService.shareToTwitter({
        text: roastData.roast,
        url: window.location.href,
        imageUrl: roastData.meme_url // Backend will handle Cloudinary optimization
      });

      if (result.success) {
        setToastMessage('Shared to Twitter! 🐦');
      } else {
        setTwitterShareError(result.error || 'Failed to share to Twitter');
      }

      logger.info('Twitter share result:', result);
    } catch (error) {
      logger.error('Twitter share failed:', error);
      setTwitterShareError(error instanceof Error ? error.message : 'Failed to share to Twitter');
    } finally {
      setIsTwitterSharing(false);
    }
  };

  const convertToPng = async (blob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            resolve(pngBlob);
          } else {
            reject(new Error("Failed to convert to PNG"));
          }
        }, "image/png");
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(blob);
    });
  };

  const handleCopy = async () => {
    if (!roastData?.meme_url) {
      setToastMessage('No meme available to copy');
      return;
    }

    setIsCopying(true);
    try {
      // Fetch the image directly
      const response = await fetch(roastData.meme_url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      // Get the original blob and convert to PNG
      const originalBlob = await response.blob();
      const pngBlob = await convertToPng(originalBlob);

      // Creates HTML content with both text and image
      const htmlContent = `
        <div>${roastData.roast}</div>
        <img src="${roastData.meme_url}" alt="Roast meme">
      `;

      // Writes to clipboard with both HTML and PNG
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'image/png': pngBlob
        })
      ]);

      setToastMessage('Roast copied to clipboard! 📋');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      setToastMessage(error instanceof Error ? error.message : 'Failed to copy');
    } finally {
      setIsCopying(false);
    }
  };

  // Handle visibility after all hooks are defined
  if (!isVisible) return null;

  // Render loading and error states
  if (loading) return <div>Loading...</div>;
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-win95-gray border-2 border-win95-gray-darker shadow-lg p-4 max-w-md">
          <div className="flex items-center mb-4">
            <span className="text-red-600 mr-2">⚠️</span>
            <h3 className="font-bold">Error</h3>
          </div>
          <p className="mb-4">{error}</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!roastData || !roastData.roast) {
    return (
      <div className="bg-win95-gray p-4 shadow-win95-out">
        <p className="text-red-500">⚠️ No roast data available</p>
        <p className="text-sm text-gray-600">Please try generating a new roast</p>
      </div>
    );
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
            <p className="text-lg mb-4">{roastData?.roast}</p>
            {roastData && <RoastMeme roastData={roastData} />}
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
              disabled={isCopying}
              className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in disabled:opacity-50"
            >
              {isCopying ? '⌛ Copying...' : '📋 Copy'}
            </button>
            <button 
              onClick={handleShare}
              disabled={isSharing}
              className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in disabled:opacity-50"
            >
              {isSharing ? '⌛ Sharing...' : '📤 Share'}
            </button>
            <button
              onClick={handleTwitterShare}
              disabled={isTwitterSharing}
              className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in disabled:opacity-50"
            >
              {isTwitterSharing ? '⌛ Testing...' : '🧪 Test Dev Tweet'}
            </button>
            {isTwitterEnabled && (
              <button
                onClick={handleTwitterShare}
                disabled={isTwitterSharing}
                className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in disabled:opacity-50"
              >
                {isTwitterSharing ? '⌛ Sharing...' : '🐦 Tweet'}
              </button>
            )}
          </div>
          {twitterShareError && (
            <div className="mt-2 text-red-500 text-sm">
              {twitterShareError}
            </div>
          )}
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