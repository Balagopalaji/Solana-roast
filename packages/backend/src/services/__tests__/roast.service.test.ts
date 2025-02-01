import { RoastService } from '../roast.service';
import { SolanaService } from '../solana.service';
import { openai } from '../../config/environment';

jest.mock('../../config/environment', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }
}));

describe('RoastService', () => {
  let roastService: RoastService;
  let mockSolanaService: jest.Mocked<SolanaService>;

  beforeEach(() => {
    mockSolanaService = {
      getWalletData: jest.fn().mockResolvedValue({
        balance: 1.5,
        transactionCount: 10,
        nftCount: 2
      })
    } as any;

    roastService = new RoastService(mockSolanaService);
  });

  it('generates a roast with meme text', async () => {
    const mockOpenAI = openai.chat.completions.create as jest.Mock;
    mockOpenAI
      .mockResolvedValueOnce({ choices: [{ message: { content: 'Test roast' } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: 'Top text\nBottom text' } }] });

    const result = await roastService.generateRoast('test-address');

    expect(result).toEqual({
      roast: 'Test roast',
      meme_top_text: 'Top text',
      meme_bottom_text: 'Bottom text'
    });
  });
}); 