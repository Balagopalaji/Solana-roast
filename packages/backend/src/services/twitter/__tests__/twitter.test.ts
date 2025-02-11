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
      accessSecret: 'test-secret',
      appUrl: 'https://solanaroast.lol'
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
    jest.useFakeTimers();

    // Mock event bus
    mockPublishEvent = jest.fn();
    mockEventBus = {
      publishEvent: mockPublishEvent
    } as any;

    // Create service instance
    devService = new DevTwitterService({ eventBus: mockEventBus });
  });

  afterEach(() => {
    jest.useRealTimers();
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
        },
        v2: {
          tweet: jest.fn().mockResolvedValue({ data: { id: 'tweet-123' } })
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

    // New tests for retry functionality
    describe('Retry Mechanism', () => {
      it('should retry on rate limit errors', async () => {
        const mockClient = {
          v1: {
            uploadMedia: jest.fn()
              .mockRejectedValueOnce({ code: 429, message: 'Rate limit' })
              .mockRejectedValueOnce({ code: 429, message: 'Rate limit' })
              .mockResolvedValueOnce('media-123'),
            verifyCredentials: jest.fn().mockResolvedValue({
              screen_name: 'test',
              id_str: '123',
              protected: false,
              verified: true
            })
          },
          v2: {
            tweet: jest.fn().mockResolvedValue({ data: { id: 'tweet-123' } })
          }
        };

        MockedTwitterApi.mockImplementation(() => mockClient as any);

        // Initialize service
        await devService.initialize();

        // Mock fetch
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({ 'content-type': 'image/jpeg' }),
          arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
        });

        // Test sharing with media
        const result = await devService.shareWithMedia(
          'Test tweet',
          'https://res.cloudinary.com/test/image.jpg',
          'wallet123'
        );

        expect(mockClient.v1.uploadMedia).toHaveBeenCalledTimes(3);
        expect(result).toBe('https://twitter.com/i/web/status/tweet-123');

        // Verify retry delays
        expect(jest.getTimerCount()).toBe(0);
        jest.runAllTimers();
      });

      it('should not retry on authentication errors', async () => {
        const mockClient = {
          v1: {
            uploadMedia: jest.fn().mockRejectedValue({
              code: 401,
              message: 'Unauthorized'
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

        // Mock fetch
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({ 'content-type': 'image/jpeg' }),
          arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
        });

        // Test sharing with media
        await expect(devService.shareWithMedia(
          'Test tweet',
          'https://res.cloudinary.com/test/image.jpg',
          'wallet123'
        )).rejects.toThrow('Twitter authentication failed');

        expect(mockClient.v1.uploadMedia).toHaveBeenCalledTimes(1);
      });

      it('should handle API access level errors', async () => {
        const mockClient = {
          v1: {
            uploadMedia: jest.fn().mockRejectedValue({
              code: 403,
              data: {
                errors: [{ code: 453 }]
              },
              message: 'Access level insufficient'
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

        // Mock fetch
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({ 'content-type': 'image/jpeg' }),
          arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
        });

        // Test sharing with media
        await expect(devService.shareWithMedia(
          'Test tweet',
          'https://res.cloudinary.com/test/image.jpg',
          'wallet123'
        )).rejects.toThrow('Twitter API access level insufficient');

        expect(mockClient.v1.uploadMedia).toHaveBeenCalledTimes(1);
      });

      it('should provide accurate status including retry information', async () => {
        const mockClient = {
          v1: {
            uploadMedia: jest.fn()
              .mockRejectedValueOnce({ code: 429, message: 'Rate limit' })
              .mockRejectedValueOnce({ code: 429, message: 'Rate limit' })
              .mockRejectedValue({ code: 429, message: 'Rate limit' }),
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

        // Mock fetch
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({ 'content-type': 'image/jpeg' }),
          arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024))
        });

        // Attempt sharing (will fail after max retries)
        try {
          await devService.shareWithMedia(
            'Test tweet',
            'https://res.cloudinary.com/test/image.jpg',
            'wallet123'
          );
        } catch (error) {
          // Expected to fail
        }

        // Check status
        const status = await devService.getStatus();
        expect(status.retryCount).toBe(3);
        expect(status.lastError).toBe('Rate limit');
        expect(status.canRetry).toBe(false);
      });
    });
  });
}); 