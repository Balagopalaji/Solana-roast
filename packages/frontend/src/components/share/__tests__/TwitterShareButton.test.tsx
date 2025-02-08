import { renderWithTimers } from '../../../test/testUtils';
import { TwitterShareButton } from '../TwitterShareButton';
import { vi } from 'vitest';

describe('TwitterShareButton', () => {
  const mockRoastData = {
    roast: "Test roast",
    meme_url: "https://example.com/meme.jpg",
    wallet: {
      address: "test-address"
    }
  };

  beforeEach(() => {
    // Reset window.open mock before each test
    vi.stubGlobal('open', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('handles tweet flow', async () => {
    const { getByRole, userEvent } = renderWithTimers(
      <TwitterShareButton roastData={mockRoastData} />
    );

    const tweetButton = getByRole('button', { name: /tweet/i });
    await userEvent.click(tweetButton);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      expect.any(String)
    );
  });
}); 