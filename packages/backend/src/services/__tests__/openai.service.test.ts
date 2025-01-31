import { OpenAIService } from '../openai.service';
import { AppError } from '../../types';

describe('OpenAIService', () => {
  let service: OpenAIService;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test_key';
    service = new OpenAIService();
  });

  describe('generateRoast', () => {
    it('should throw error for invalid wallet address', async () => {
      await expect(service.generateRoast('invalid-address'))
        .rejects
        .toThrow(AppError);
    });

    it('should return cached response if available', async () => {
      const mockResponse = {
        roast: 'test roast',
        meme_top_text: 'top',
        meme_bottom_text: 'bottom'
      };

      // @ts-ignore - accessing private cache
      service.cache.set('DRtqaYHyXFPVD5hzKHk3f9JF5GwEjAHgtqzxVHnM8u9Y', mockResponse);

      const result = await service.generateRoast('DRtqaYHyXFPVD5hzKHk3f9JF5GwEjAHgtqzxVHnM8u9Y');
      expect(result).toEqual(mockResponse);
    });
  });
}); 