import React, { useState } from 'react';
import { RoastResponse } from '../../types/roast';
import { shareService } from '../../services/share.service';
import { Toast } from '../common/Toast';

interface ShareButtonProps {
  roastData: RoastResponse;
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ roastData, className }) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const result = await shareService.shareLink({ roastData, type: 'link' });
      
      if (result.success) {
        setToastMessage('Share link copied to clipboard!');
      } else {
        setToastMessage(result.error || 'Failed to share');
      }
      
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to share roast');
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
        {loading ? 'Sharing...' : 'Share'}
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