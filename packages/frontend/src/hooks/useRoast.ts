import { useState } from 'react';
import { roastService } from '../services/roast.service';
import { RoastResponse } from '../types/roast';

export const useRoast = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roastData, setRoastData] = useState<RoastResponse | null>(null);

  const generateRoast = async (walletAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await roastService.generateRoast(walletAddress);
      setRoastData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate roast');
    } finally {
      setLoading(false);
    }
  };

  return { generateRoast, loading, error, roastData };
}; 