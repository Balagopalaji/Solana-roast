import React, { useState } from 'react';
import { RoastResponse } from '../../types/roast';
import { shareService } from '../../services/share.service';
import { Toast } from '../common/Toast';

interface TwitterShareButtonProps {
  roastData: RoastResponse;
  className?: string;
}

export const TwitterShareButton: React.FC<TwitterShareButtonProps> = ({ roastData, className }) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const result = await shareService.shareRoast({
        text: roastData.roast,
        url: window.location.href,
        type: 'twitter',
        image_url: roastData.meme_url // Optional: include meme image if available
      });
      
      if (!result.success) {
        setToastMessage(result.error?.message || 'Failed to share to Twitter');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('Failed to open Twitter share');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleShare}
        disabled={loading}
        className={`px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in disabled:opacity-50 ${className}`}
      >
        {loading ? 'Opening Twitter...' : '🐦 Tweet'}
      </button>
      
      {showToast && (
        <Toast 
          message={toastMessage} 
          onClose={() => setShowToast(false)} 
        />
      )}
    </>
  );
}; 