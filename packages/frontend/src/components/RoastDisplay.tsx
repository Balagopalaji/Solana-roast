import React from 'react';
import { RoastResponse } from '../types/roast';
import { ShareButtons } from './share/ShareButtons';
import { WindowFrame } from './common/WindowFrame';

interface RoastDisplayProps {
  roastData: RoastResponse;
}

export const RoastDisplay: React.FC<RoastDisplayProps> = ({ roastData }) => {
  const { memeUrl, roast } = roastData;

  return (
    <WindowFrame 
      title="🔥 Your Roast Is Ready" 
      className="roast-container"
    >
      <div className="roast-content">
        {/* Main roast text */}
        <p className="roast-text">{roast}</p>

        {/* Meme image */}
        {memeUrl && (
          <div className="meme-container">
            <img src={memeUrl} alt="Roast Meme" className="meme-image" />
          </div>
        )}

        {/* Share buttons */}
        <ShareButtons 
          memeUrl={memeUrl} 
          roastText={roast}
        />
      </div>
    </WindowFrame>
  );
}; 