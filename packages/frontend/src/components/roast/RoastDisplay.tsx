import React, { useCallback, useState, useEffect } from 'react';
import { RoastResponse } from '../../types/roast';
import { Toast } from '../common/Toast';
import { RoastMeme } from './RoastMeme';

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
      // Fallback for browsers that don't support share
      handleCopy();
    }
  }, [roastData?.roast, handleCopy]);

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
          {loading && (
            <div className="flex items-center justify-center p-8">
              <span className="animate-pulse">Analyzing wallet data...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border-2 border-win95-gray-darker p-4 mb-4">
              <div className="flex items-center">
                <span className="text-red-600 mr-2">❌</span>
                <p className="text-red-700">
                  {error.includes('Failed to fetch') 
                    ? 'Server connection error. Please try again.' 
                    : error}
                </p>
              </div>
            </div>
          )}

          {roastData && !loading && (
            <div className="space-y-4">
              <div className="bg-white border-2 border-win95-gray-darker p-4 mb-4">
                <p className="text-lg">{roastData.roast}</p>
              </div>
              
              <RoastMeme roastData={roastData} />

              <div className="flex justify-end gap-2">
                <button 
                  onClick={handleCopy}
                  className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in"
                >
                  Copy
                </button>
                <button 
                  onClick={handleShare}
                  className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in"
                >
                  Share
                </button>
              </div>
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