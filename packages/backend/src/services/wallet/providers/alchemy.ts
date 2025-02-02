import { Network, Alchemy } from 'alchemy-sdk';
import { WalletProvider, WalletData, TokenData, NFTData } from '../types';
import logger from '../../../utils/logger';
import { environment } from '../../../config/environment';

export class AlchemyProvider implements WalletProvider {
  private alchemy: Alchemy;

  constructor() {
    const settings = {
      apiKey: environment.solana.alchemy.apiKey,
      network: environment.solana.network === 'mainnet-beta' ? 
        Network.SolanaMainnet : Network.SolanaDevnet
    };
    this.alchemy = new Alchemy(settings);
  }

  async getWalletData(address: string): Promise<WalletData> {
    try {
      const [balance, nfts, tokens] = await Promise.all([
        this.alchemy.core.getBalance(address),
        this.getNFTs(address),
        this.getTokens(address)
      ]);

      return {
        address,
        balance: Number(balance),
        nftCount: nfts.length,
        transactionCount: 0, // Will implement in next phase
        tokenCount: tokens.length
      };
    } catch (error) {
      logger.error('Alchemy getWalletData failed:', error);
      throw error;
    }
  }

  async getTokens(address: string): Promise<TokenData[]> {
    try {
      const response = await this.alchemy.core.getTokensForOwner(address);
      
      return response.tokens.map((token: any) => ({
        mint: token.address,
        amount: Number(token.balance),
        decimals: token.decimals
      }));
    } catch (error) {
      logger.error('Alchemy getTokens failed:', error);
      throw error;
    }
  }

  async getNFTs(address: string): Promise<NFTData[]> {
    try {
      const nfts = await this.alchemy.nft.getNftsForOwner(address);
      
      return nfts.ownedNfts.map((nft: any) => ({
        mint: nft.address,
        name: nft.name || 'Unknown NFT',
        image: nft.image?.gateway || undefined
      }));
    } catch (error) {
      logger.error('Alchemy getNFTs failed:', error);
      throw error;
    }
  }

  // Implement other interface methods...
} 