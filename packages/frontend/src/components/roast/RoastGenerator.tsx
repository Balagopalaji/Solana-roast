import { useState } from 'react';
import { roastService } from '../../services/roast.service';
import { ErrorBoundary } from '../common/ErrorBoundary';
import type { RoastResponse } from '../../types/roast';
import { Button, Window } from '../ui';
import { logger } from '../../utils/logger';
import { validateWalletAddress } from '../../utils/validation';
import { metrics } from '../../services/metrics.service';

export function RoastGenerator({ walletAddress }: { walletAddress: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roastData, setRoastData] = useState<RoastResponse | null>(null);

  const handleGenerateRoast = async () => {
    try {
      metrics.trackEvent({
        category: 'roast',
        action: 'generate_start',
        label: walletAddress
      });

      // Clear previous state
      setLoading(true);
      setError(null);
      
      // Validate wallet address
      const validation = validateWalletAddress(walletAddress);
      if (!validation.valid) {
        setError(validation.error || 'Invalid wallet address');
        return;
      }

      logger.debug('Generating roast for wallet:', {
        address: walletAddress,
        timestamp: new Date().toISOString()
      });
      
      const response = await roastService.generateRoast({ walletAddress });
      setRoastData(response);

      metrics.trackEvent({
        category: 'roast',
        action: 'generate_success',
        value: response.duration
      });
    } catch (error) {
      metrics.trackError({
        error,
        context: 'generate_roast',
        metadata: { wallet: walletAddress }
      });
      
      logger.error('Failed to generate roast:', {
        error,
        walletAddress,
        timestamp: new Date().toISOString()
      });
      
      // Improved error messages
      if (error instanceof Error) {
        if (error.message.includes('429')) {
          setError('Too many requests. Please try again in a moment.');
        } else if (error.message.includes('500')) {
          setError('Server error. Please try again later.');
        } else {
          setError(error.message);
        }
      } else {
        setError('Failed to generate roast. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <Window title="🔥 Your Roast Is Ready">
        {error && (
          <div className="error-message text-red-500 p-4 bg-red-100 rounded">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="loading p-4">Generating your roast...</div>
        ) : (
          <>
            <Button 
              onClick={handleGenerateRoast}
              disabled={loading}
              className="mb-4"
            >
              Generate Roast
            </Button>

            {roastData && (
              <div className="roast-content p-4">
                <p className="text-lg mb-4">{roastData.roast}</p>
                {roastData.meme_url && (
                  <img 
                    src={roastData.meme_url} 
                    alt="Roast Meme" 
                    className="roast-meme max-w-full h-auto rounded"
                  />
                )}
              </div>
            )}
          </>
        )}
      </Window>
    </ErrorBoundary>
  );
} 