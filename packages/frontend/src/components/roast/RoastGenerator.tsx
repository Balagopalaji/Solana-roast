import { useState } from 'react';
import { roastService } from '../../services/roast.service';
import { ErrorBoundary } from '../common/ErrorBoundary';
import type { RoastResponse } from '../../types/roast';
import { Button, Window } from '../ui';
import { logger } from '../../utils/logger';
import { validateWalletAddress } from '../../utils/validation';
import { metrics } from '../../services/metrics.service';
import { useWallet } from '../../hooks/useWallet';
import { RoastDisplay } from './RoastDisplay';

export const RoastGenerator: React.FC = () => {
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roastData, setRoastData] = useState<RoastResponse | null>(null);

  const handleGenerateRoast = async () => {
    if (!publicKey) return;
    
    try {
      metrics.trackEvent({
        category: 'roast',
        action: 'generate_start',
        label: publicKey.toString()
      });

      // Clear previous state
      setLoading(true);
      setError(null);
      
      // Validate wallet address
      const validation = validateWalletAddress(publicKey.toString());
      if (!validation.valid) {
        setError(validation.error || 'Invalid wallet address');
        return;
      }

      logger.debug('Generating roast for wallet:', {
        address: publicKey.toString(),
        timestamp: new Date().toISOString()
      });
      
      const response = await roastService.generateRoast(publicKey.toString());
      setRoastData(response);

      metrics.trackEvent({
        category: 'roast',
        action: 'generate_success',
        label: publicKey.toString()
      });
    } catch (error) {
      metrics.trackError({
        error: error instanceof Error ? error : new Error('Unknown error'),
        context: 'generate_roast',
        metadata: { wallet: publicKey?.toString() }
      });
      
      logger.error('Failed to generate roast:', {
        error,
        walletAddress: publicKey?.toString(),
        timestamp: new Date().toISOString()
      });
      
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
              <RoastDisplay
                roastData={roastData}
                loading={loading}
                error={error}
                onClose={() => setRoastData(null)}
              />
            )}
          </>
        )}
      </Window>
    </ErrorBoundary>
  );
}; 