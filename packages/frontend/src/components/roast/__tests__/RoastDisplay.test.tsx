import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { RoastDisplay } from '../RoastDisplay';
import { vi } from 'vitest';
import { renderWithTimers } from '../../../test/testUtils';

// Mock dependencies
vi.mock('../../../utils/image', () => ({
  downloadImage: vi.fn().mockImplementation(() => Promise.resolve(true))
}));

// Mock data
const mockRoastData = {
  roast: "Test roast message",
  meme_top_text: "Top text",
  meme_bottom_text: "Bottom text",
  meme_url: "https://example.com/meme.jpg",
  wallet: {
    address: "testAddress123",
    balance: 1.5,
    nftCount: 2,
    transactionCount: 10,
    lastActivity: new Date()
  }
};

describe('RoastDisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock window.navigator.share
    Object.assign(window.navigator, {
      share: vi.fn().mockResolvedValue(undefined),
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });
    
    // Mock window.open for Twitter
    window.open = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // Helper to find buttons by both text and role
  const findButton = (text: string) => 
    screen.getAllByRole('button', { name: new RegExp(text, 'i') })[0];

  it('renders loading state', () => {
    render(<RoastDisplay loading={true} roastData={null} error={null} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<RoastDisplay loading={false} roastData={null} error="Test error" />);
    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
  });

  it('renders roast data correctly', () => {
    render(<RoastDisplay loading={false} roastData={mockRoastData} error={null} />);
    expect(screen.getByText(mockRoastData.roast)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <RoastDisplay 
        loading={false} 
        roastData={mockRoastData} 
        error={null} 
        onClose={onClose} 
      />
    );

    await act(async () => {
      fireEvent.click(findButton('X'));
      await vi.runAllTimersAsync();
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('handles copy functionality', async () => {
    render(<RoastDisplay loading={false} roastData={mockRoastData} error={null} />);
    
    await act(async () => {
      fireEvent.click(findButton('Copy'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Roast copied to clipboard!')).toBeInTheDocument();
    });
  });

  it('handles share functionality', async () => {
    render(<RoastDisplay loading={false} roastData={mockRoastData} error={null} />);
    
    await act(async () => {
      fireEvent.click(findButton('Share'));
    });
    
    expect(window.navigator.share).toHaveBeenCalledWith({
      title: 'My Solana Wallet Roast',
      text: mockRoastData.roast,
      url: expect.any(String)
    });
  });

  it('handles meme download', async () => {
    const { downloadImage } = await import('../../../utils/image');
    
    render(<RoastDisplay loading={false} roastData={mockRoastData} error={null} />);
    
    await act(async () => {
      fireEvent.click(findButton('Save Meme'));
    });
    
    expect(downloadImage).toHaveBeenCalledWith(
      mockRoastData.meme_url,
      expect.objectContaining({
        filename: expect.stringContaining('solana-roast-testAddr')
      })
    );
  });

  it('handles core functionality', async () => {
    const onClose = vi.fn();
    const { getByText, getByRole, advanceTimers, cleanup } = renderWithTimers(
      <RoastDisplay 
        loading={false} 
        roastData={mockRoastData} 
        error={null}
        onClose={onClose}
      />
    );

    // Test display
    expect(getByText(mockRoastData.roast)).toBeInTheDocument();

    // Test copy
    await getByRole('button', { name: /copy/i }).click();
    await advanceTimers(100);
    expect(getByText(/copied/i)).toBeInTheDocument();

    // Test close
    await getByRole('button', { name: /x/i }).click();
    await advanceTimers(100);
    expect(onClose).toHaveBeenCalled();

    cleanup();
  });

  it('handles loading and error states', () => {
    const { getByText: getLoadingText, cleanup: cleanupLoading } = renderWithTimers(
      <RoastDisplay loading={true} roastData={null} error={null} />
    );
    expect(getLoadingText(/loading/i)).toBeInTheDocument();
    cleanupLoading();

    const { getByText: getErrorText, cleanup: cleanupError } = renderWithTimers(
      <RoastDisplay loading={false} roastData={null} error="Test error" />
    );
    expect(getErrorText(/error/i)).toBeInTheDocument();
    cleanupError();
  });
}); 