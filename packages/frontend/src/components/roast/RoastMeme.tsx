import React from 'react';
import { RoastResponse } from '../../types/roast';

interface RoastMemeProps {
  roastData: RoastResponse;
}

export const RoastMeme: React.FC<RoastMemeProps> = ({ roastData }) => {
  return (
    <div className="relative w-full bg-win95-gray border-2 border-win95-gray-darker my-4">
      {/* Windows 95 title bar */}
      <div className="bg-win95-blue text-white px-2 py-1">
        <span>🔥 Your Meme Is Ready</span>
      </div>

      {/* Meme content */}
      <div className="relative bg-black">
        {roastData.meme_url ? (
          <img 
            src={roastData.meme_url} 
            alt="Roast Meme"
            className="w-full h-auto"
            onError={(e) => {
              e.currentTarget.src = '/fallback-meme.png';
            }}
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Loading meme...
          </div>
        )}
      </div>
    </div>
  );
}; 