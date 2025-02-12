import { TwitterMediaService, TwitterMediaError } from '../twitter-media.service';

// Mock cloudinary module
jest.mock('cloudinary', () => {
  const mockUpload = jest.fn();
  return {
    v2: {
      config: jest.fn(),
      uploader: {
        upload: mockUpload
      }
    }
  };
});

// Import cloudinary after mocking
const cloudinary = require('cloudinary');

describe('TwitterMediaService', () => {
  let mediaService: TwitterMediaService;
  let mockTwitterClient: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock Twitter client
    mockTwitterClient = {
      v1: {
        uploadMedia: jest.fn(),
        mediaStatus: jest.fn()
      }
    };

    // Initialize service
    mediaService = new TwitterMediaService();
  });

  describe('processAndUpload', () => {
    const mockImageUrl = 'https://example.com/image.jpg';
    const mockOptimizedUrl = 'https://res.cloudinary.com/demo/image/upload/v1/optimized.jpg';
    const mockMediaId = '12345';

    beforeEach(() => {
      // Mock Cloudinary upload
      cloudinary.v2.uploader.upload.mockResolvedValue({
        secure_url: mockOptimizedUrl
      });

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
      });

      // Mock Twitter client responses
      mockTwitterClient.v1.uploadMedia.mockResolvedValue({
        media_id_string: mockMediaId
      });
      mockTwitterClient.v1.mediaStatus.mockResolvedValue({
        processing_info: { state: 'succeeded' }
      });
    });

    it('should successfully process and upload media', async () => {
      const mediaId = await mediaService.processAndUpload(mockImageUrl, mockTwitterClient);

      expect(mediaId).toBe(mockMediaId);
      expect(cloudinary.v2.uploader.upload).toHaveBeenCalledWith(mockImageUrl, expect.any(Object));
      expect(mockTwitterClient.v1.uploadMedia).toHaveBeenCalled();
      expect(mockTwitterClient.v1.mediaStatus).toHaveBeenCalledWith(mockMediaId);
    });

    it('should handle Cloudinary optimization failure', async () => {
      cloudinary.v2.uploader.upload.mockRejectedValue(new Error('Optimization failed'));

      await expect(mediaService.processAndUpload(mockImageUrl, mockTwitterClient))
        .rejects
        .toThrow(TwitterMediaError);
    });

    it('should handle Twitter upload failure', async () => {
      mockTwitterClient.v1.uploadMedia.mockRejectedValue(new Error('Upload failed'));

      await expect(mediaService.processAndUpload(mockImageUrl, mockTwitterClient))
        .rejects
        .toThrow(TwitterMediaError);
    });

    it('should handle media processing failure', async () => {
      mockTwitterClient.v1.mediaStatus.mockResolvedValue({
        processing_info: {
          state: 'failed',
          error: { message: 'Processing failed' }
        }
      });

      await expect(mediaService.processAndUpload(mockImageUrl, mockTwitterClient))
        .rejects
        .toThrow(TwitterMediaError);
    });

    it('should handle media processing timeout', async () => {
      mockTwitterClient.v1.mediaStatus.mockResolvedValue({
        processing_info: { state: 'in_progress' }
      });

      await expect(mediaService.processAndUpload(mockImageUrl, mockTwitterClient))
        .rejects
        .toThrow('Media processing timed out');
    });

    it('should use chunked upload for large files', async () => {
      // Mock a large file (6MB)
      global.fetch = jest.fn().mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(6 * 1024 * 1024))
      });

      await mediaService.processAndUpload(mockImageUrl, mockTwitterClient);

      // Should call uploadMedia with INIT command
      expect(mockTwitterClient.v1.uploadMedia).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          command: 'INIT'
        })
      );

      // Should call uploadMedia with FINALIZE command
      expect(mockTwitterClient.v1.uploadMedia).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          command: 'FINALIZE'
        })
      );
    });
  });
}); 