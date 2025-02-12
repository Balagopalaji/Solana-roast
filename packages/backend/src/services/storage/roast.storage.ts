import { RedisStorage } from './redis.storage';
import { RoastResponse, StoredRoastResponse } from '../../types/roast';
import logger from '../../utils/logger';

export class RoastStorage extends RedisStorage<StoredRoastResponse> {
  constructor() {
    super({
      prefix: 'roast',
      ttl: 24 * 60 * 60 // 24 hours
    });
    logger.info('RoastStorage initialized');
  }

  async storeRoast(walletAddress: string, roastData: RoastResponse): Promise<void> {
    try {
      const storageData: StoredRoastResponse = {
        ...roastData,
        wallet: {
          ...roastData.wallet,
          lastActivity: roastData.wallet.lastActivity?.toISOString()
        }
      };

      await this.set(walletAddress, storageData);
      logger.debug('Roast stored successfully', { walletAddress });
    } catch (error) {
      logger.error('Failed to store roast:', error);
      throw error;
    }
  }

  async getRoast(walletAddress: string): Promise<RoastResponse | null> {
    try {
      const storedData = await this.get(walletAddress);
      if (!storedData) {
        return null;
      }

      return {
        ...storedData,
        wallet: {
          ...storedData.wallet,
          lastActivity: storedData.wallet.lastActivity ? new Date(storedData.wallet.lastActivity) : undefined
        }
      };
    } catch (error) {
      logger.error('Failed to get roast:', error);
      throw error;
    }
  }

  async listRecentRoasts(limit: number = 10): Promise<RoastResponse[]> {
    try {
      const storedRoasts = await this.list('*');
      return storedRoasts
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, limit)
        .map(storedRoast => ({
          ...storedRoast,
          wallet: {
            ...storedRoast.wallet,
            lastActivity: storedRoast.wallet.lastActivity ? new Date(storedRoast.wallet.lastActivity) : undefined
          }
        }));
    } catch (error) {
      logger.error('Failed to list recent roasts:', error);
      throw error;
    }
  }
} 