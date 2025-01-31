import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { AppError, WalletData } from '../types';
import logger from '../utils/logger';
import axios from 'axios';
import NodeCache from 'node-cache';
import { environment } from '../config/environment';

export class SolanaService {
  private connection: Connection;
  private solscanApiUrl: string;
  private cache: NodeCache;

  constructor() {
    this.connection = new Connection(environment.solana.rpcUrl, 'confirmed');
    this.solscanApiUrl = environment.solana.solscanApiUrl;
    // Cache wallet data for 5 minutes
    this.cache = new NodeCache({ stdTTL: 300 });
  }

  public isValidWalletAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  public async getWalletData(address: string): Promise<WalletData> {
    if (!this.isValidWalletAddress(address)) {
      throw new AppError(400, 'error', 'Invalid Solana wallet address');
    }

    // Check cache first
    const cachedData = this.cache.get<WalletData>(address);
    if (cachedData) {
      logger.debug('Returning cached wallet data for:', address);
      return cachedData;
    }

    try {
      const publicKey = new PublicKey(address);
      
      // Get SOL balance
      const balance = await this.connection.getBalance(publicKey);
      
      // Get account info from Solscan
      const accountInfo = await this.getSolscanAccountInfo(address);

      const walletData: WalletData = {
        address,
        balance: balance / LAMPORTS_PER_SOL,
        isActive: balance > 0,
        lastActivity: accountInfo.lastActivity,
        nftCount: accountInfo.nftCount,
        tokenCount: accountInfo.tokenCount
      };

      // Cache the result
      this.cache.set(address, walletData);

      return walletData;
    } catch (error) {
      logger.error('Error fetching wallet data:', error);
      throw new AppError(
        500,
        'error',
        'Failed to fetch wallet data. Please try again later.'
      );
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