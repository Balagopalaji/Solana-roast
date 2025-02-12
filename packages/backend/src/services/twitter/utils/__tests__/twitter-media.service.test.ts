/// <reference types="jest" />
import { TwitterMediaService, TwitterMediaError } from '../twitter-media.service';
import { v2 as cloudinary } from 'cloudinary';
import { environment } from '../../../../config/environment';
import { TwitterApi } from 'twitter-api-v2';

// Mock cloudinary module
jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn()
    }
  }
}));

const mockOptimizedUrl = 'https://optimized-image.url';
const mockMediaId = '123456789';
const mockImageUrl = 'https://original-image.url';

describe('TwitterMediaService', () => {
  let mediaService: TwitterMediaService;
  let mockTwitterClient: jest.Mocked<TwitterApi>;

  beforeEach(() => {
    // Mock Twitter client
    mockTwitterClient = {
      v1: {
        uploadMedia: jest.fn().mockResolvedValue(mockMediaId),
        mediaStatus: jest.fn().mockResolvedValue({ state: 'succeeded' })
      }
    } as unknown as jest.Mocked<TwitterApi>;

    // Mock Cloudinary upload
    (cloudinary.uploader.upload as jest.Mock).mockResolvedValue({
      secure_url: mockOptimizedUrl
    });

    mediaService = new TwitterMediaService();
  });

  describe('processAndUpload', () => {
    beforeEach(() => {
      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
      });
    });

    it('should successfully process and upload media', async () => {
      const mediaId = await mediaService.processAndUpload(mockImageUrl, mockTwitterClient);

      expect(mediaId).toBe(mockMediaId);
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(mockImageUrl, expect.any(Object));
      expect(mockTwitterClient.v1.uploadMedia).toHaveBeenCalled();
      expect(mockTwitterClient.v1.mediaStatus).toHaveBeenCalledWith(mockMediaId);
    });

    it('should handle Cloudinary optimization failure', async () => {
      cloudinary.uploader.upload.mockRejectedValue(new Error('Optimization failed'));

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