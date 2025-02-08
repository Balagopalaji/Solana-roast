import { RoastService } from '../services/roast.service';
import { SolanaService } from '../services/solana.service';
import { RoastResponse } from '../types';
import logger from '../utils/logger';

export class RoastController {
  private roastService: RoastService;
  private solanaService: SolanaService;

  constructor() {
    this.solanaService = new SolanaService();
    this.roastService = new RoastService(this.solanaService);
  }

  async generateRoast(address: string): Promise<RoastResponse> {
    try {
      logger.info('Controller: Generating roast for address:', address);

      // Validate wallet address
      if (!this.solanaService.isValidWalletAddress(address)) {
        throw new Error('Invalid Solana wallet address');
      }

      // Generate roast
      const roastData = await this.roastService.generateRoast(address);
      
      logger.info('Controller: Roast generated successfully');
      return roastData;
    } catch (error) {
      logger.error('Controller: Error generating roast:', error);
      throw error;
    }
  }
} 