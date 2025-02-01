import { render, screen, fireEvent } from '@testing-library/react';
import { ShareButton } from '../ShareButton';
import { shareService } from '../../../services/share.service';
import { vi } from 'vitest';

vi.mock('../../../services/share.service', () => ({
  shareService: {
    shareLink: vi.fn()
  }
}));

describe('ShareButton', () => {
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
  });

  it('renders share button', () => {
    render(<ShareButton roastData={mockRoastData} />);
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('shows loading state while sharing', async () => {
    vi.mocked(shareService.shareLink).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<ShareButton roastData={mockRoastData} />);
    
    fireEvent.click(screen.getByText('Share'));
    expect(screen.getByText('Sharing...')).toBeInTheDocument();
  });

  it('shows success toast after sharing', async () => {
    vi.mocked(shareService.shareLink).mockResolvedValueOnce({
      success: true,
      url: 'https://example.com/share'
    });

    render(<ShareButton roastData={mockRoastData} />);
    
    fireEvent.click(screen.getByText('Share'));
    expect(await screen.findByText('Share link copied to clipboard!')).toBeInTheDocument();
  });
}); 