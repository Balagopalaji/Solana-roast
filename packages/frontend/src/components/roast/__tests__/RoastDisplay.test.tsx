import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { RoastDisplay } from '../RoastDisplay';
import { vi } from 'vitest';

describe('RoastDisplay', () => {
  const mockRoastData = {
    roast: "Test roast message",
    meme_top_text: "Top text",
    meme_bottom_text: "Bottom text",
    meme_url: "https://example.com/meme.jpg",
    wallet: {
      address: "test-address",
      balance: 1.5,
      nftCount: 2,
      transactionCount: 10,
      lastActivity: new Date()
    }
  };

  it('renders loading state correctly', () => {
    render(<RoastDisplay loading={true} roastData={null} error={null} />);
    expect(screen.getByText(/Analyzing wallet data/i)).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    render(<RoastDisplay loading={false} roastData={null} error="Test error" />);
    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
  });

  it('renders roast data correctly', () => {
    render(<RoastDisplay loading={false} roastData={mockRoastData} error={null} />);
    expect(screen.getByText(mockRoastData.roast)).toBeInTheDocument();
  });

  it('handles copy functionality', async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined)
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    render(<RoastDisplay loading={false} roastData={mockRoastData} error={null} />);
    
    const copyButton = screen.getByText(/Copy/i);
    await fireEvent.click(copyButton);

    expect(mockClipboard.writeText).toHaveBeenCalledWith(mockRoastData.roast);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <RoastDisplay 
        loading={false} 
        roastData={mockRoastData} 
        error={null} 
        onClose={onClose} 
      />
    );

    const closeButton = screen.getByText('X');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('shows toast message after successful copy', async () => {
    render(<RoastDisplay roastData={mockRoastData} loading={false} error={null} />);
    
    await act(async () => {
      fireEvent.click(screen.getByText('Copy'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Roast copied to clipboard!')).toBeInTheDocument();
    });
  });
}); 