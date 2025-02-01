import { roastService } from '../roast.service';

describe('roastService', () => {
  beforeEach(() => {
    // Clear all mocks between tests
    jest.clearAllMocks();
  });

  it('should generate a roast successfully', async () => {
    const mockResponse = {
      data: {
        roast: 'Test roast',
        meme_top_text: 'Top text',
        meme_bottom_text: 'Bottom text'
      }
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await roastService.generateRoast('test-wallet-address');
    
    expect(result).toEqual(mockResponse.data);
    expect(fetch).toHaveBeenCalledWith('/api/roast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress: 'test-wallet-address' }),
    });
  });

  it('should handle errors properly', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false
    });

    await expect(roastService.generateRoast('test-wallet-address'))
      .rejects
      .toThrow('Failed to generate roast');
  });
}); 