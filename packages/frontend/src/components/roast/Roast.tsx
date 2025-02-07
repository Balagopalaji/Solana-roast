import { useState } from 'react';
import { roastService } from '../../services/roast.service';
import { RoastResponse } from '../../types/roast';

interface RoastProps {
  walletAddress: string;
}

export function Roast({ walletAddress }: RoastProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roastData, setRoastData] = useState<RoastResponse | null>(null);

  const handleRoastClick = async () => {
    if (!walletAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Generating roast for:', walletAddress);
      const response = await roastService.generateRoast(walletAddress);
      setRoastData(response);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate roast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}
      
      <button 
        onClick={handleRoastClick}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate Roast'}
      </button>

      {roastData && (
        <div className="mt-4">
          <p className="text-lg mb-4">{roastData.roast}</p>
          {roastData.meme_url && (
            <img 
              src={roastData.meme_url} 
              alt="Roast Meme" 
              className="max-w-full h-auto rounded"
            />
          )}
        </div>
      )}
    </div>
  );
} 