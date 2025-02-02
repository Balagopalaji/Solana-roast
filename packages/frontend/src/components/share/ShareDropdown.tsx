import React, { useState, useRef, useEffect } from 'react';
import { RoastResponse } from '../../types/roast';
import { shareService } from '../../services/share.service';
import { Toast } from '../common/Toast';

interface ShareDropdownProps {
  roastData: RoastResponse;
  className?: string;
}

export const ShareDropdown: React.FC<ShareDropdownProps> = ({ roastData, className }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showDropdown && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      
      // Check if there's enough space below
      const spaceBelow = windowHeight - buttonRect.bottom;
      setDropdownPosition(spaceBelow < dropdownHeight + 10 ? 'top' : 'bottom');
    }
  }, [showDropdown]);

  const handleCopy = async () => {
    setLoading(true);
    try {
      await navigator.clipboard.writeText(roastData.roast);
      setToastMessage('Roast copied to clipboard!');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to copy roast');
      setShowToast(true);
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  const handleTweet = async () => {
    setLoading(true);
    try {
      const result = await shareService.shareTwitter({ roastData, type: 'twitter' });
      if (!result.success) {
        setToastMessage(result.error || 'Failed to share to Twitter');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('Failed to open Twitter');
      setShowToast(true);
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  const handleNativeShare = async () => {
    setLoading(true);
    try {
      // For native sharing, we can use the screenshot approach
      const memeElement = getMemeElement();
      if (!memeElement) {
        throw new Error('Meme element not found');
      }

      const imageBlob = await captureElement(memeElement);
      const file = new File([imageBlob], 'roast.jpg', { type: 'image/jpeg' });

      await navigator.share({
        title: 'Solana Wallet Roast',
        text: roastData.roast,
        files: [file],
        url: window.location.href
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setToastMessage('Failed to open share dialog');
        setShowToast(true);
      }
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading}
        className={`px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in disabled:opacity-50 ${className}`}
      >
        {loading ? 'Sharing...' : '📤 Share'}
      </button>
      
      {showDropdown && (
        <div 
          ref={dropdownRef}
          className={`absolute ${
            dropdownPosition === 'top' 
              ? 'bottom-full mb-2' 
              : 'top-full mt-2'
          } right-0 w-48 bg-win95-gray border-2 border-win95-gray-darker shadow-win95-out`}
        >
          <button
            onClick={handleCopy}
            className="w-full px-4 py-2 text-left hover:bg-win95-gray-light"
          >
            📋 Copy to Clipboard
          </button>
          <button
            onClick={handleTweet}
            className="w-full px-4 py-2 text-left hover:bg-win95-gray-light"
          >
            🐦 Share on Twitter
          </button>
          {/* Only show if native sharing is available */}
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full px-4 py-2 text-left hover:bg-win95-gray-light"
            >
              📱 Share via...
            </button>
          )}
        </div>
      )}
      
      {showToast && (
        <Toast 
          message={toastMessage} 
          onClose={() => setShowToast(false)} 
        />
      )}
    </div>
  );
}; 