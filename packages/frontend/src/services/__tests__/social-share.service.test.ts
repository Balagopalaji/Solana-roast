import { describe, it, expect, vi, beforeEach } from 'vitest';
import { socialShareService } from '../social-share.service';
import CloudinaryService from '../cloudinary.service';

// Mock CloudinaryService
vi.mock('../cloudinary.service');
vi.mock('../../config/environment', () => ({
  environment: {
    features: { twitter: true },
    cloudinary: {
      cloudName: 'test',
      uploadPreset: 'test'
    }
  }
}));

describe('SocialShareService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.open mock
    vi.spyOn(window, 'open').mockImplementation(() => null);

    // Mock Cloudinary upload with correct return type
    vi.mocked(CloudinaryService.prototype.uploadImage).mockResolvedValue(
      'https://cloudinary.com/test.jpg' // Return string instead of object
    );
  });

  it('should share to Twitter without image', async () => {
    const result = await socialShareService.shareToTwitter({
      text: 'Test roast',
      url: 'https://test.com'
    });

    expect(result.success).toBe(true);
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://twitter.com/intent/tweet'),
      '_blank'
    );
  });

  it('should handle Cloudinary upload for images', async () => {
    const mockBlob = new Blob(['test']);
    const result = await socialShareService.shareToTwitter({
      text: 'Test roast',
      url: 'https://test.com',
      image: mockBlob
    });

    expect(result.success).toBe(true);
    expect(CloudinaryService.prototype.uploadImage).toHaveBeenCalledWith(mockBlob);
  });

  it('should handle Cloudinary errors gracefully', async () => {
    vi.mocked(CloudinaryService.prototype.uploadImage).mockRejectedValue(
      new Error('Upload failed')
    );

    const result = await socialShareService.shareToTwitter({
      text: 'Test roast',
      url: 'https://test.com',
      image: new Blob(['test'])
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle upload cancellation', async () => {
    vi.mocked(CloudinaryService.prototype.uploadImage).mockRejectedValue(
      new Error('Upload cancelled')
    );

    const result = await socialShareService.shareToTwitter({
      text: 'Test roast',
      url: 'https://test.com',
      image: new Blob(['test'])
    });

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('cancelled');
  });
}); 