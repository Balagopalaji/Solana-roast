import { DevTwitterService } from '../dev-twitter.service';
import { TwitterApi } from 'twitter-api-v2';
import { EventBusService } from '../../events/event-bus.service';
import { EventType } from '../../events/events.types';

// Mock twitter-api-v2
jest.mock('twitter-api-v2');
const MockedTwitterApi = TwitterApi as jest.MockedClass<typeof TwitterApi>;

// Mock environment
jest.mock('../../../config/environment', () => ({
  environment: {
    twitter: {
      apiKey: 'test-key',
      apiSecret: 'test-secret',
      accessToken: 'test-token',
      accessSecret: 'test-secret'
    }
  }
}));

describe('Twitter Services', () => {
  let devService: DevTwitterService;
  let mockEventBus: EventBusService;
  let mockPublishEvent: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock event bus
    mockPublishEvent = jest.fn();
    mockEventBus = {
      publishEvent: mockPublishEvent
    } as any;

    // Create service instance
    devService = new DevTwitterService({ eventBus: mockEventBus });
  });

  describe('DevTwitterService', () => {
    it('should initialize with Twitter API credentials', async () => {
      await devService.initialize();
      expect(MockedTwitterApi).toHaveBeenCalledWith({
        appKey: 'test-key',
        appSecret: 'test-secret',
        accessToken: 'test-token',
        accessSecret: 'test-secret'
      });
    });

    it('should validate media before uploading', async () => {
      const mockClient = {
        v1: {
          uploadMedia: jest.fn().mockResolvedValue('media-123'),
          tweet: jest.fn().mockResolvedValue({ id_str: 'tweet-123' }),
          verifyCredentials: jest.fn().mockResolvedValue({
            screen_name: 'test',
            id_str: '123',
            protected: false,
            verified: true
          })
        }
      };

      MockedTwitterApi.mockImplementation(() => mockClient as any);

      // Initialize service
      await devService.initialize();

      // Mock fetch for image download
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({
          'content-type': 'image/jpeg'
        }),
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
      });

      // Test sharing with media
      const result = await devService.shareWithMedia(
        'Test tweet',
        'https://res.cloudinary.com/test/image.jpg',
        'wallet123'
      );

      // Verify events were emitted
      expect(mockPublishEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: EventType.TWITTER_SHARE_STARTED,
        payload: expect.objectContaining({
          walletAddress: 'wallet123',
          shareMethod: 'dev'
        })
      }));

      expect(mockPublishEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: EventType.TWITTER_SHARE_COMPLETED,
        payload: expect.objectContaining({
          walletAddress: 'wallet123',
          tweetUrl: 'https://twitter.com/i/web/status/tweet-123',
          shareMethod: 'dev'
        })
      }));

      expect(result).toBe('https://twitter.com/i/web/status/tweet-123');
    });

    it('should handle media upload errors', async () => {
      const mockClient = {
        v1: {
          uploadMedia: jest.fn().mockRejectedValue({
            message: 'Upload failed',
            code: 400
          }),
          verifyCredentials: jest.fn().mockResolvedValue({
            screen_name: 'test',
            id_str: '123',
            protected: false,
            verified: true
          })
        }
      };

      MockedTwitterApi.mockImplementation(() => mockClient as any);

      // Initialize service
      await devService.initialize();

      // Mock fetch for image download
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({
          'content-type': 'image/jpeg'
        }),
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
      });

      // Test sharing with media
      await expect(devService.shareWithMedia(
        'Test tweet',
        'https://res.cloudinary.com/test/image.jpg',
        'wallet123'
      )).rejects.toThrow('Failed to post tweet: Upload failed');

      // Verify error event was emitted
      expect(mockPublishEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: EventType.TWITTER_SHARE_FAILED,
        payload: expect.objectContaining({
          walletAddress: 'wallet123',
          error: 'Upload failed',
          shareMethod: 'dev'
        })
      }));
    });

    it('should handle invalid image URLs', async () => {
      await devService.initialize();

      await expect(devService.shareWithMedia(
        'Test tweet',
        'https://invalid-domain.com/image.jpg',
        'wallet123'
      )).rejects.toThrow('Domain invalid-domain.com not allowed');

      // Verify error event was emitted
      expect(mockPublishEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: EventType.TWITTER_SHARE_FAILED,
        payload: expect.objectContaining({
          walletAddress: 'wallet123',
          error: 'Domain invalid-domain.com not allowed',
          shareMethod: 'dev'
        })
      }));
    });

    it('should handle authentication errors', async () => {
      const mockClient = {
        v1: {
          verifyCredentials: jest.fn().mockRejectedValue({
            message: 'Invalid credentials',
            code: 401
          })
        }
      };

      MockedTwitterApi.mockImplementation(() => mockClient as any);

      await expect(devService.initialize())
        .resolves.toBe(false);
    });
  });
}); 