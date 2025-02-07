import { vi, describe, it, expect, beforeEach } from 'vitest';
import { roastService } from '../roast.service';

describe('roastService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate a roast successfully', async () => {
    const mockResponse = {
      data: {
        roast: 'Test roast',
        meme_url: 'test.jpg',
        wallet: {
          address: 'test-address',
          balance: 1.5,
          nftCount: 2,
          transactionCount: 10
        }
      }
    };
    
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response);

    const result = await roastService.generateRoast('test-address');
    expect(result).toEqual(mockResponse.data);
  });

  it('should handle errors properly', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: () => Promise.resolve({ error: 'Server Error' })
    } as Response);

    await expect(roastService.generateRoast('test-address'))
      .rejects
      .toThrow('Failed to generate roast');
  });
}); 