import { EventBusService } from '../event-bus.service';
import { EventType, RoastEvent, TwitterShareEvent } from '../events.types';
import { Redis } from 'ioredis';
import { AppEvent } from '../base-event.service';

// Mock Redis
jest.mock('ioredis');

describe('EventBusService', () => {
  let eventBus: EventBusService;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    // Reset singleton instance
    (EventBusService as any).instance = null;
    // Get new instance
    eventBus = EventBusService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EventBusService.getInstance();
      const instance2 = EventBusService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Event Publishing', () => {
    it('should publish RoastEvent successfully', async () => {
      const event = EventBusService.createEvent<RoastEvent>(
        EventType.ROAST_GENERATED,
        {
          walletAddress: '0x123',
          roastText: 'Test roast',
          timestamp: Date.now()
        },
        'test'
      );

      await expect(eventBus.publishEvent(event)).resolves.not.toThrow();
    });

    it('should reject invalid event types', async () => {
      const invalidEvent = {
        type: 'INVALID_TYPE',
        payload: {},
        timestamp: Date.now(),
        source: 'test'
      };

      await expect(eventBus.publishEvent(invalidEvent)).rejects.toThrow('Invalid event type');
    });

    it('should add timestamp if not present', async () => {
      const event: Omit<AppEvent, 'timestamp'> = {
        type: EventType.ROAST_GENERATED,
        payload: {
          walletAddress: '0x123',
          roastText: 'Test roast'
        },
        source: 'test'
      };

      await eventBus.publishEvent(event as AppEvent);
      expect((event as AppEvent).timestamp).toBeDefined();
    });
  });

  describe('Event Subscription', () => {
    it('should handle subscriptions correctly', async () => {
      const handler = jest.fn();
      
      eventBus.subscribeToEvent(EventType.TWITTER_SHARE_STARTED, handler);
      
      const event = EventBusService.createEvent<TwitterShareEvent>(
        EventType.TWITTER_SHARE_STARTED,
        {
          walletAddress: '0x123',
          timestamp: Date.now(),
          shareMethod: 'dev'
        },
        'test'
      );

      await eventBus.publishEvent(event);
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should handle multiple subscribers', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      eventBus.subscribeToEvent(EventType.ROAST_GENERATED, handler1);
      eventBus.subscribeToEvent(EventType.ROAST_GENERATED, handler2);
      
      const event = EventBusService.createEvent<RoastEvent>(
        EventType.ROAST_GENERATED,
        {
          walletAddress: '0x123',
          roastText: 'Test roast',
          timestamp: Date.now()
        },
        'test'
      );

      await eventBus.publishEvent(event);
      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
    });

    it('should handle unsubscribe correctly', async () => {
      const handler = jest.fn();
      
      eventBus.subscribeToEvent(EventType.ROAST_GENERATED, handler);
      eventBus.unsubscribeFromEvent(EventType.ROAST_GENERATED, handler);
      
      const event = EventBusService.createEvent<RoastEvent>(
        EventType.ROAST_GENERATED,
        {
          walletAddress: '0x123',
          roastText: 'Test roast',
          timestamp: Date.now()
        },
        'test'
      );

      await eventBus.publishEvent(event);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis errors gracefully', async () => {
      const mockRedis = Redis as jest.MockedClass<typeof Redis>;
      mockRedis.prototype.publish.mockRejectedValueOnce(new Error('Redis error'));

      const event = EventBusService.createEvent<RoastEvent>(
        EventType.ROAST_GENERATED,
        {
          walletAddress: '0x123',
          roastText: 'Test roast',
          timestamp: Date.now()
        },
        'test'
      );

      await expect(eventBus.publishEvent(event)).rejects.toThrow('Redis error');
    });

    it('should handle handler errors without breaking other handlers', async () => {
      const successHandler = jest.fn();
      const errorHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      
      eventBus.subscribeToEvent(EventType.ROAST_GENERATED, successHandler);
      eventBus.subscribeToEvent(EventType.ROAST_GENERATED, errorHandler);
      
      const event = EventBusService.createEvent<RoastEvent>(
        EventType.ROAST_GENERATED,
        {
          walletAddress: '0x123',
          roastText: 'Test roast',
          timestamp: Date.now()
        },
        'test'
      );

      await eventBus.publishEvent(event);
      expect(successHandler).toHaveBeenCalled();
      expect(errorHandler).toHaveBeenCalled();
    });
  });
}); 