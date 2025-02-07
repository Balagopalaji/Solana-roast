import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadImage } from '../image';

describe('downloadImage', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock fetch
    global.fetch = vi.fn();
    
    // Mock URL methods
    URL.createObjectURL = vi.fn(() => 'mock-blob-url');
    URL.revokeObjectURL = vi.fn();
    
    // Mock DOM methods
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  it('successfully downloads an image', async () => {
    // Mock successful fetch response
    const mockBlob = new Blob(['mock-image-data'], { type: 'image/png' });
    (global.fetch as any).mockResolvedValue({
      blob: () => Promise.resolve(mockBlob)
    });

    // Mock link click
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    document.createElement = vi.fn().mockReturnValue(mockLink);

    const result = await downloadImage('https://example.com/image.png', {
      filename: 'test-image.png'
    });

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/image.png');
    expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockLink.download).toBe('test-image.png');
    expect(mockLink.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
  });

  it('handles download failure', async () => {
    // Mock failed fetch
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const result = await downloadImage('https://example.com/image.png');

    expect(result).toBe(false);
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/image.png');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('uses default filename if none provided', async () => {
    const mockBlob = new Blob(['mock-image-data'], { type: 'image/png' });
    (global.fetch as any).mockResolvedValue({
      blob: () => Promise.resolve(mockBlob)
    });

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    document.createElement = vi.fn().mockReturnValue(mockLink);

    await downloadImage('https://example.com/image.png');

    expect(mockLink.download).toBe('roast-meme.png');
  });

  it('cleans up resources after download', async () => {
    const mockBlob = new Blob(['mock-image-data'], { type: 'image/png' });
    (global.fetch as any).mockResolvedValue({
      blob: () => Promise.resolve(mockBlob)
    });

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    document.createElement = vi.fn().mockReturnValue(mockLink);

    await downloadImage('https://example.com/image.png');

    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
}); 