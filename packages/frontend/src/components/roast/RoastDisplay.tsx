import React, { useCallback, useState, useEffect } from 'react';
import { RoastResponse } from '../../types/roast';
import { Toast } from '../common/Toast';
import { RoastMeme } from './RoastMeme';
import { downloadImage } from '../../utils/image';
import { metrics } from '../../services/metrics.service';
import { shareService } from '../../services/share.service';
import { metadataService } from '../../services/metadata.service';

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
    if (!roastData?.roast) return;
    
    const result = await shareService.shareRoast({
      text: roastData.roast,
      url: window.location.href,
      type: 'native'
    });

    if (result.success) {
      setToastMessage(
        result.method === 'clipboard' 
          ? 'Copied to clipboard!' 
          : 'Shared successfully!'
      );
    } else if (result.error?.message.includes('cancelled')) {
      // Don't show error message for user cancellations
      return;
    } else {
      setToastMessage('Failed to share. Try copying instead.');
    }
  }, [roastData?.roast]);

  const handleDownload = useCallback(async () => {
    if (!roastData?.meme_url) {
      setToastMessage('No meme available to download');
      return;
    }
    
    const filename = `solana-roast-${roastData.wallet?.address.slice(0, 8)}`;
    const success = await downloadImage(roastData.meme_url, { filename });
    setToastMessage(success ? 'Meme downloaded successfully! 🎉' : 'Failed to download meme');
  }, [roastData?.meme_url, roastData?.wallet?.address]);

  const handleTwitterShare = useCallback(async () => {
    if (!roastData?.roast) return;
    
    const result = await shareService.shareRoast({
      text: roastData.roast,
      url: window.location.href,
      type: 'twitter'
    });

    if (!result.success) {
      setToastMessage('Failed to open Twitter. Try copying instead.');
    }
  }, [roastData?.roast]);

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

      // Create HTML content
      const htmlContent = `
        <div>${roastData.roast}</div>
        <img src="${roastData.meme_url}" alt="Roast meme">
      `;

      // Write to clipboard
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