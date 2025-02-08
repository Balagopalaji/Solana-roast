import { OpenAIService } from '../openai.service';
import { AppError } from '../../types';
import { WalletData } from '../../types';

describe('OpenAIService', () => {
  let service: OpenAIService;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test_key';
    service = new OpenAIService();
  });

  describe('generateRoast', () => {
    it('should throw error for invalid wallet address', async () => {
      const invalidWalletData: WalletData = {
        address: 'invalid-address',
        balance: 0,
        transactionCount: 0,
        nftCount: 0,
        lastActivity: new Date()
      };

      await expect(service.generateRoast(invalidWalletData))
        .rejects
        .toThrow(AppError);
    });

    it('should return cached response if available', async () => {
      const mockResponse = {
        roast: 'test roast',
        meme_top_text: 'top',
        meme_bottom_text: 'bottom'
      };

      const walletData: WalletData = {
        address: 'DRtqaYHyXFPVD5hzKHk3f9JF5GwEjAHgtqzxVHnM8u9Y',
        balance: 1.5,
        transactionCount: 10,
        nftCount: 2,
        lastActivity: new Date()
      };

      // @ts-ignore - accessing private cache
      service.cache.set(walletData.address, mockResponse);

      const result = await service.generateRoast(walletData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle test generation', async () => {
      const mockWalletData: WalletData = {
        address: 'DRtqaYHyXFPVD5hzKHk3f9JF5GwEjAHgtqzxVHnM8u9Y',
        balance: 1.5,
        transactionCount: 10,
        nftCount: 2,
        lastActivity: new Date()
      };

      // Test implementation
    });
  });
}); 