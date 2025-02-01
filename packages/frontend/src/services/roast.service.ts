import { RoastResponse } from '../types/roast';

export const roastService = {
  async generateRoast(walletAddress: string): Promise<RoastResponse> {
    try {
      console.log('Generating roast for wallet:', walletAddress);
      
      const response = await fetch('/api/roast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Server error:', responseData);
        throw new Error(responseData.message || 'Failed to generate roast');
      }

      if (!responseData.data) {
        console.error('Invalid response format:', responseData);
        throw new Error('Invalid response from server');
      }

      return responseData.data;
    } catch (error) {
      console.error('Roast generation error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to generate roast');
    }
  }
}; 