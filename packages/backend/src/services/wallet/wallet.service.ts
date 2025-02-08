import { WalletProvider, WalletData, TokenData, NFTData } from './types';
import { SolanaRPCProvider } from './providers/solana-rpc';
import logger from '../../utils/logger';

export class WalletService {
  private provider: WalletProvider;
  
  constructor() {
    this.provider = new SolanaRPCProvider();
  }

  async getWalletData(address: string): Promise<WalletData> {
    try {
      const data = await this.provider.getWalletData(address);
      logger.debug('Wallet data retrieved successfully', {
        provider: this.provider.constructor.name,
        address
      });
      return data;
    } catch (error) {
      logger.error('Failed to get wallet data:', error);
      throw error;
    }
  }

  async getTokens(address: string): Promise<TokenData[]> {
    try {
      return await this.provider.getTokens(address);
    } catch (error) {
      logger.warn('Failed to get tokens:', error);
      return [];
    }
  }

  async getNFTs(address: string): Promise<NFTData[]> {
    try {
      return await this.provider.getNFTs(address);
    } catch (error) {
      logger.warn('Failed to get NFTs:', error);
      return [];
    }
  }
} 