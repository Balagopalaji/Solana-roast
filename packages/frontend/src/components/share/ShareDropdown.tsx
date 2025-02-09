import React, { useState, useRef, useEffect } from 'react';
import { RoastResponse } from '../../types/roast';
import { shareService } from '../../services/share.service';
import { Toast } from '../common/Toast';
import { metrics } from '../../services/metrics.service';
import { clipboardService } from '../../services/clipboard.service';

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

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Position dropdown based on available space
  useEffect(() => {
    if (showDropdown && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      
      const spaceBelow = windowHeight - buttonRect.bottom;
      setDropdownPosition(spaceBelow < dropdownHeight + 10 ? 'top' : 'bottom');
    }
  }, [showDropdown]);

  const handleShare = async (type: 'native' | 'twitter' | 'clipboard') => {
    setLoading(true);
    try {
      metrics.trackEvent({
        category: 'share',
        action: 'click',
        label: type
      });

      if (type === 'clipboard' && roastData.meme_url) {
        // Direct clipboard handling
        await clipboardService.copyToClipboard(
          roastData.roast,
          roastData.meme_url
        );
        setToastMessage('Copied to clipboard with meme!');
        setShowToast(true);
      } else {
        const result = await shareService.shareRoast({
          text: roastData.roast,
          url: window.location.href,
          type,
          image_url: roastData.meme_url
        });

        if (!result.success && result.error) {
          setToastMessage(result.error.message);
          setShowToast(true);
        }
      }
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Share failed');
      setShowToast(true);
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
          } right-0 w-48 bg-win95-gray border-2 border-win95-gray-darker shadow-win95-out z-50`}
        >
          <button
            onClick={() => handleShare('clipboard')}
            className="w-full px-4 py-2 text-left hover:bg-win95-gray-light border-b border-win95-gray-darker"
          >
            📋 Copy to Clipboard
          </button>
          <button
            onClick={() => handleShare('twitter')}
            className="w-full px-4 py-2 text-left hover:bg-win95-gray-light border-b border-win95-gray-darker"
          >
            🐦 Share on Twitter
          </button>
          {typeof navigator !== 'undefined' && 
           'share' in navigator && (
            <button
              onClick={() => handleShare('native')}
              className="w-full px-4 py-2 text-left hover:bg-win95-gray-light"
            >
              💾 Save/Share
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