import { render, screen, fireEvent } from '@testing-library/react';
import { TwitterShareButton } from '../TwitterShareButton';
import { shareService } from '../../../services/share.service';
import { vi } from 'vitest';

vi.mock('../../../services/share.service', () => ({
  shareService: {
    shareTwitter: vi.fn()
  }
}));

describe('TwitterShareButton', () => {
  const mockRoastData = {
    roast: 'Test roast',
    meme_url: 'https://example.com/meme.jpg',
    wallet: {
      address: 'test-address',
      balance: 1.5
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.open
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('renders tweet button', () => {
    render(<TwitterShareButton roastData={mockRoastData} />);
    expect(screen.getByText(/Tweet/)).toBeInTheDocument();
  });

  it('shows loading state while sharing', async () => {
    vi.mocked(shareService.shareTwitter).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<TwitterShareButton roastData={mockRoastData} />);
    
    fireEvent.click(screen.getByText(/Tweet/));
    expect(screen.getByText(/Opening Twitter/)).toBeInTheDocument();
  });

  it('handles share errors', async () => {
    vi.mocked(shareService.shareTwitter).mockResolvedValueOnce({
      success: false,
      error: 'Failed to share'
    });

    render(<TwitterShareButton roastData={mockRoastData} />);
    
    fireEvent.click(screen.getByText(/Tweet/));
    expect(await screen.findByText(/Failed to share/)).toBeInTheDocument();
  });
}); 