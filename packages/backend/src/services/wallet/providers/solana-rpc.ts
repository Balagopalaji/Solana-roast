import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletProvider, WalletData, TokenData, NFTData } from '../types';
import logger from '../../../utils/logger';
import { environment } from '../../../config/environment';

export class SolanaRPCProvider implements WalletProvider {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(
      environment.solana.rpcUrl,
      'confirmed'
    );
  }

  async getWalletData(address: string): Promise<WalletData> {
    try {
      const pubKey = new PublicKey(address);
      const [balance, signatures] = await Promise.all([
        this.connection.getBalance(pubKey),
        this.connection.getSignaturesForAddress(pubKey, { limit: 1000 })
      ]);

      return {
        address,
        balance: balance / LAMPORTS_PER_SOL,
        transactionCount: signatures.length,
        nftCount: 0,
        tokenCount: 0
      };
    } catch (error) {
      logger.error('Solana RPC getWalletData failed:', error);
      throw error;
    }
  }

  async getTokens(address: string): Promise<TokenData[]> {
    try {
      const pubKey = new PublicKey(address);
      const tokens = await this.connection.getParsedTokenAccountsByOwner(pubKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      });

      return tokens.value.map(({ account }) => ({
        mint: account.data.parsed.info.mint,
        amount: Number(account.data.parsed.info.tokenAmount.amount),
        decimals: account.data.parsed.info.tokenAmount.decimals
      }));
    } catch (error) {
      logger.error('Solana RPC getTokens failed:', error);
      throw error;
    }
  }

  async getNFTs(_address: string): Promise<NFTData[]> {
    return [];
  }
} 