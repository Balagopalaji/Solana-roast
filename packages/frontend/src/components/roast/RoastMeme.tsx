import React, { useEffect, useState } from 'react';
import { RoastResponse } from '../../types/roast';
import { imageService } from '../../services/image.service';

interface RoastMemeProps {
  roastData: RoastResponse;
}

export const RoastMeme: React.FC<RoastMemeProps> = ({ roastData }) => {
  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roastData.meme_url) {
      // No meme URL available, don't try to optimize
      return;
    }

    let isMounted = true;

    imageService.optimizeImage(roastData.meme_url, {
      maxWidth: 800,
      quality: 0.85,
      format: 'webp'
    })
    .then(result => {
      if (isMounted) {
        setOptimizedUrl(result.url);
        setError(null);
      }
    })
    .catch(err => {
      console.error('Image optimization failed:', err);
      if (isMounted) {
        // Fall back to original URL if optimization fails
        setOptimizedUrl(roastData.meme_url);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [roastData.meme_url]);

  // Show just the roast text if no meme is available
  if (!roastData.meme_url) {
    return (
      <div className="bg-win95-gray p-4 shadow-win95-out">
        <p className="text-lg mb-4">{roastData.roast}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-win95-gray p-4 shadow-win95-out">
        <p className="text-red-500">⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-win95-gray p-4 shadow-win95-out">
      <img 
        src={optimizedUrl || roastData.meme_url}
        alt="Roast Meme"
        className="w-full max-w-2xl mx-auto rounded shadow-lg"
        loading="lazy"
        onError={(e) => {
          console.error('Image load error:', e);
          e.currentTarget.src = '/fallback-meme.png';
          setError('Failed to load image');
        }}
      />
    </div>
  );
}; 