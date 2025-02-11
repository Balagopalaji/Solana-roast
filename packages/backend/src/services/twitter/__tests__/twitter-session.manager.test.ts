import { TwitterApi } from 'twitter-api-v2';
import { TwitterSessionManager } from '../twitter-session.manager';
import { TwitterTokenStorage } from '../twitter-token.storage';
import { EventBusService } from '../../events/event-bus.service';
import { EventType } from '../../events/events.types';

// Mock twitter-api-v2
jest.mock('twitter-api-v2');
const MockedTwitterApi = TwitterApi as jest.MockedClass<typeof TwitterApi>;

// Mock TokenStorage
jest.mock('../twitter-token.storage');
const MockedTokenStorage = TwitterTokenStorage as jest.MockedClass<typeof TwitterTokenStorage>;

// Mock EventBus
jest.mock('../../events/event-bus.service', () => ({
  EventBusService: {
    getInstance: jest.fn().mockReturnValue({
      publishEvent: jest.fn(),
      subscribe: jest.fn()
    })
  }
}));

describe('TwitterSessionManager', () => {
  let sessionManager: TwitterSessionManager;
  let mockTokenStorage: jest.Mocked<TwitterTokenStorage>;
  let mockEventBus: jest.Mocked<EventBusService>;
  
  const mockTokens = {
    userId: 'user123',
    username: 'testuser',
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() + 3600000 // 1 hour from now
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up environment variables
    process.env.TWITTER_API_KEY = 'test-api-key';
    process.env.TWITTER_API_SECRET = 'test-api-secret';
    process.env.TWITTER_CLIENT_ID = 'test-client-id';
    process.env.TWITTER_CLIENT_SECRET = 'test-client-secret';

    // Create mock instances
    mockTokenStorage = new MockedTokenStorage() as jest.Mocked<TwitterTokenStorage>;
    mockEventBus = EventBusService.getInstance() as jest.Mocked<EventBusService>;

    // Initialize session manager
    sessionManager = new TwitterSessionManager({
      tokenStorage: mockTokenStorage,
      eventBus: mockEventBus
    });
  });

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      // Mock token storage
      mockTokenStorage.storeUserTokens.mockResolvedValue();

      // Mock Twitter client
      const mockClient = {
        v1: {
          verifyCredentials: jest.fn().mockResolvedValue({
            screen_name: 'testuser',
            id_str: '123',
            verified: true
          })
        }
      };
      MockedTwitterApi.mockImplementation(() => mockClient as any);

      const session = await sessionManager.createSession(mockTokens);

      expect(session).toBeDefined();
      expect(session.userId).toBe(mockTokens.userId);
      expect(session.username).toBe(mockTokens.username);
      expect(session.client).toBeDefined();
      expect(session.expiresAt).toBe(mockTokens.expiresAt);
      expect(mockTokenStorage.storeUserTokens).toHaveBeenCalledWith(mockTokens.userId, mockTokens);
    });

    it('should handle creation errors', async () => {
      mockTokenStorage.storeUserTokens.mockRejectedValue(new Error('Storage error'));

      await expect(sessionManager.createSession(mockTokens))
        .rejects.toThrow('Failed to create Twitter session');
    });
  });

  describe('getSession', () => {
    it('should return existing session from memory', async () => {
      // Create initial session
      await sessionManager.createSession(mockTokens);

      // Get the session
      const session = await sessionManager.getSession(mockTokens.userId);

      expect(session).toBeDefined();
      expect(session!.userId).toBe(mockTokens.userId);
      expect(mockTokenStorage.getUserTokens).not.toHaveBeenCalled();
    });

    it('should restore session from storage if not in memory', async () => {
      mockTokenStorage.getUserTokens.mockResolvedValue(mockTokens);

      const mockClient = {
        v1: {
          verifyCredentials: jest.fn().mockResolvedValue({
            screen_name: 'testuser',
            id_str: '123',
            verified: true
          })
        }
      };
      MockedTwitterApi.mockImplementation(() => mockClient as any);

      const session = await sessionManager.getSession(mockTokens.userId);

      expect(session).toBeDefined();
      expect(session!.userId).toBe(mockTokens.userId);
      expect(mockTokenStorage.getUserTokens).toHaveBeenCalledWith(mockTokens.userId);
    });

    it('should return null for non-existent session', async () => {
      mockTokenStorage.getUserTokens.mockResolvedValue(null);

      const session = await sessionManager.getSession('nonexistent');

      expect(session).toBeNull();
    });
  });

  describe('refreshSession', () => {
    it('should refresh session successfully', async () => {
      // Set up expired tokens
      const expiredTokens = {
        ...mockTokens,
        expiresAt: Date.now() - 1000 // Expired
      };

      // Mock storage
      mockTokenStorage.getUserTokens.mockResolvedValue(expiredTokens);
      mockTokenStorage.storeUserTokens.mockResolvedValue();

      // Mock OAuth2 refresh
      const mockRefreshResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };
      MockedTwitterApi.prototype.refreshOAuth2Token = jest.fn().mockResolvedValue(mockRefreshResult);

      // Create initial session
      const initialSession = await sessionManager.createSession(expiredTokens);

      // Get session (should trigger refresh)
      const refreshedSession = await sessionManager.getSession(mockTokens.userId);

      expect(refreshedSession).toBeDefined();
      expect(refreshedSession!.userId).toBe(mockTokens.userId);
      expect(mockEventBus.publishEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: EventType.TWITTER_AUTH_COMPLETED
      }));
    });

    it('should handle refresh failures', async () => {
      // Set up expired tokens
      const expiredTokens = {
        ...mockTokens,
        expiresAt: Date.now() - 1000 // Expired
      };

      // Mock storage
      mockTokenStorage.getUserTokens.mockResolvedValue(expiredTokens);

      // Mock OAuth2 refresh failure
      MockedTwitterApi.prototype.refreshOAuth2Token = jest.fn().mockRejectedValue(new Error('Refresh failed'));

      // Create initial session
      const initialSession = await sessionManager.createSession(expiredTokens);

      // Attempt to get session (should trigger refresh)
      await expect(sessionManager.getSession(mockTokens.userId))
        .rejects.toThrow('Failed to refresh Twitter session');

      expect(mockEventBus.publishEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: EventType.TWITTER_AUTH_FAILED
      }));
    });
  });

  describe('validateSession', () => {
    it('should validate active session successfully', async () => {
      // Mock client verification
      const mockClient = {
        v1: {
          verifyCredentials: jest.fn().mockResolvedValue({
            screen_name: 'testuser',
            id_str: '123',
            verified: true
          })
        }
      };
      MockedTwitterApi.mockImplementation(() => mockClient as any);

      // Create session
      await sessionManager.createSession(mockTokens);

      const isValid = await sessionManager.validateSession(mockTokens.userId);

      expect(isValid).toBe(true);
      expect(mockClient.v1.verifyCredentials).toHaveBeenCalled();
    });

    it('should return false for invalid session', async () => {
      const mockClient = {
        v1: {
          verifyCredentials: jest.fn().mockRejectedValue(new Error('Invalid credentials'))
        }
      };
      MockedTwitterApi.mockImplementation(() => mockClient as any);

      // Create session
      await sessionManager.createSession(mockTokens);

      const isValid = await sessionManager.validateSession(mockTokens.userId);

      expect(isValid).toBe(false);
    });
  });

  describe('listActiveSessions', () => {
    it('should list all active sessions', async () => {
      // Mock multiple valid tokens
      const tokens1 = { ...mockTokens, userId: 'user1' };
      const tokens2 = { ...mockTokens, userId: 'user2' };

      mockTokenStorage.listValidTokens.mockResolvedValue([tokens1, tokens2]);

      const mockClient = {
        v1: {
          verifyCredentials: jest.fn().mockResolvedValue({
            screen_name: 'testuser',
            id_str: '123',
            verified: true
          })
        }
      };
      MockedTwitterApi.mockImplementation(() => mockClient as any);

      const sessions = await sessionManager.listActiveSessions();

      expect(sessions).toHaveLength(2);
      expect(sessions[0].userId).toBe('user1');
      expect(sessions[1].userId).toBe('user2');
    });

    it('should handle session restoration failures', async () => {
      // Mock one valid and one invalid token
      const validToken = { ...mockTokens, userId: 'valid' };
      const invalidToken = { ...mockTokens, userId: 'invalid' };

      mockTokenStorage.listValidTokens.mockResolvedValue([validToken, invalidToken]);

      const mockClient = {
        v1: {
          verifyCredentials: jest.fn()
            .mockResolvedValueOnce({
              screen_name: 'testuser',
              id_str: '123',
              verified: true
            })
            .mockRejectedValueOnce(new Error('Invalid session'))
        }
      };
      MockedTwitterApi.mockImplementation(() => mockClient as any);

      const sessions = await sessionManager.listActiveSessions();

      expect(sessions).toHaveLength(1);
      expect(sessions[0].userId).toBe('valid');
    });
  });
}); 