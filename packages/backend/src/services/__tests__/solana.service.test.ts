import { SolanaService } from '../solana.service';
import { AppError } from '../../types';
import axios from 'axios';
import { Connection } from '@solana/web3.js';

// Mock external dependencies
jest.mock('axios');
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn(),
  PublicKey: jest.fn().mockImplementation((key) => ({
    toBase58: () => key,
  })),
  LAMPORTS_PER_SOL: 1000000000,
}));

describe('SolanaService', () => {
  let service: SolanaService;
  const mockAxios = axios as jest.Mocked<typeof axios>;
  const validAddress = 'DRtqaYHyXFPVD5hzKHk3f9JF5GwEjAHgtqzxVHnM8u9Y';

  beforeEach(() => {
    jest.clearAllMocks();
    (Connection as jest.Mock).mockImplementation(() => ({
      getBalance: jest.fn().mockResolvedValue(1000000000), // 1 SOL
    }));
    service = new SolanaService();
  });

  describe('isValidWalletAddress', () => {
    it('should return true for valid Solana address', () => {
      const validAddress = 'DRtqaYHyXFPVD5hzKHk3f9JF5GwEjAHgtqzxVHnM8u9Y';
      expect(service.isValidWalletAddress(validAddress)).toBe(true);
    });

    it('should return false for invalid address', () => {
      const invalidAddress = 'invalid-address';
      expect(service.isValidWalletAddress(invalidAddress)).toBe(false);
    });
  });

  describe('getWalletData', () => {
    it('should return wallet data for valid address', async () => {
      const mockSolscanResponse = {
        data: {
          data: {
            timestamp: 1677686400, // Example timestamp
            nftCount: 5,
            tokenCount: 10
          }
        }
      };

      mockAxios.get.mockResolvedValueOnce(mockSolscanResponse);

      const result = await service.getWalletData(validAddress);

      expect(result).toEqual({
        address: validAddress,
        balance: 1, // 1 SOL
        isActive: true,
        lastActivity: new Date(1677686400 * 1000).toISOString(),
        nftCount: 5,
        tokenCount: 10
      });
    });

    it('should handle Solscan API errors gracefully', async () => {
      mockAxios.get.mockRejectedValueOnce(new Error('API Error'));

      const result = await service.getWalletData(validAddress);

      expect(result).toEqual({
        address: validAddress,
        balance: 1,
        isActive: true,
        lastActivity: null,
        nftCount: 0,
        tokenCount: 0
      });
    });

    it('should return cached data if available', async () => {
      const mockData = {
        address: validAddress,
        balance: 1,
        isActive: true,
        lastActivity: null,
        nftCount: 0,
        tokenCount: 0
      };

      // @ts-ignore - accessing private cache
      service.cache.set(validAddress, mockData);

      const result = await service.getWalletData(validAddress);
      expect(result).toEqual(mockData);
      expect(mockAxios.get).not.toHaveBeenCalled();
    });
  });
}); 