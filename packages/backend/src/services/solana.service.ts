import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL,
  SignaturesForAddressOptions 
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { environment } from '../config/environment';
import { WalletData } from '../types';
import logger from '../utils/logger';
import axios from 'axios';
import NodeCache from 'node-cache';

export class SolanaService {
  private connection: Connection;
  private solscanApiUrl: string;
  private cache: NodeCache;

  constructor() {
    this.connection = new Connection(
      environment.solana.rpcUrl,
      { commitment: 'confirmed' }
    );
    this.solscanApiUrl = environment.solana.solscanApiUrl;
    // Cache wallet data for 5 minutes
    this.cache = new NodeCache({ stdTTL: 300 });
  }

  isValidWalletAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  async getWalletData(address: string): Promise<WalletData> {
    try {
      const pubKey = new PublicKey(address);

      // Get balance
      const balance = await this.connection.getBalance(pubKey);
      const solBalance = balance / LAMPORTS_PER_SOL;

      // Get NFT count
      const nftResponse = await this.connection.getParsedTokenAccountsByOwner(pubKey, {
        programId: TOKEN_PROGRAM_ID
      });

      const nftCount = nftResponse.value.filter(item => {
        const parsedInfo = item.account.data.parsed.info;
        return parsedInfo.tokenAmount.decimals === 0 && 
               parsedInfo.tokenAmount.amount === "1";
      }).length;

      // Get transaction history using getSignaturesForAddress
      let transactionCount = 0;
      let lastActivity: Date | undefined;

      try {
        const options: SignaturesForAddressOptions = { limit: 1000 };
        const signatures = await this.connection.getSignaturesForAddress(pubKey, options);

        transactionCount = signatures.length;
        if (signatures.length > 0 && signatures[0].blockTime) {
          lastActivity = new Date(signatures[0].blockTime * 1000);
        }
      } catch (error) {
        logger.warn('Failed to fetch transaction history:', error);
        // Continue with default values if transaction history fails
      }

      const result = {
        address,
        balance: solBalance,
        nftCount,
        transactionCount,
        lastActivity
      };

      logger.info('Wallet data fetched:', result);
      return result;
    } catch (error) {
      logger.error('Error fetching wallet data:', error);
      throw new Error('Failed to fetch wallet data');
    }
  }

  private async getSolscanAccountInfo(address: string) {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${environment.solana.solscanApiKey}`
      };

      const response = await axios.get(
        `${this.solscanApiUrl}/v2/account/${address}`,
        { headers }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return {
        lastActivity: response.data.timestamp 
          ? new Date(response.data.timestamp * 1000).toISOString()
          : null,
        nftCount: response.data.nftCount || 0,
        tokenCount: response.data.tokenCount || 0
      };
    } catch (error) {
      logger.error('Error fetching Solscan data:', error);
      return {
        lastActivity: null,
        nftCount: 0,
        tokenCount: 0
      };
    }
  }
}

export const solanaService = new SolanaService(); 