import { RoastResponse } from '../types/roast';

class RoastService {
  private baseUrl = 'http://localhost:3000'; // Hardcode for now to test

  async generateRoast(walletAddress: string): Promise<RoastResponse> {
    try {
      console.log('Attempting to generate roast for:', walletAddress);
      
      const response = await fetch(`${this.baseUrl}/roast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress })
      });

      if (!response.ok) {
        throw new Error('Failed to generate roast');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Roast generation error:', error);
      throw error;
    }
  }
}

export const roastService = new RoastService(); 