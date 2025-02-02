import { WalletProvider, WalletData, TokenData, NFTData } from './types';
import { AlchemyProvider } from './providers/alchemy';
import { SolanaRPCProvider } from './providers/solana-rpc';
import logger from '../../utils/logger';

export class WalletService {
  private providers: WalletProvider[];
  
  constructor() {
    this.providers = [
      new AlchemyProvider(),     // Primary provider
      new SolanaRPCProvider()    // Fallback provider
    ];
  }

  async getWalletData(address: string): Promise<WalletData> {
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      try {
        const data = await provider.getWalletData(address);
        logger.debug('Wallet data retrieved successfully', {
          provider: provider.constructor.name,
          address
        });
        return data;
      } catch (error) {
        lastError = error as Error;
        logger.warn('Provider failed, trying next', {
          provider: provider.constructor.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        continue;
      }
    }

    throw lastError || new Error('All providers failed');
  }

  async getTokens(address: string): Promise<TokenData[]> {
    for (const provider of this.providers) {
      try {
        return await provider.getTokens(address);
      } catch (error) {
        continue;
      }
    }
    return [];
  }

  async getNFTs(address: string): Promise<NFTData[]> {
    for (const provider of this.providers) {
      try {
        return await provider.getNFTs(address);
      } catch (error) {
        continue;
      }
    }
    return [];
  }
} 