import { BaseEventService, AppEvent } from './base-event.service';
import { EventType } from './events.types';
import logger from '../../utils/logger';

export class EventBusService extends BaseEventService {
  private static instance: EventBusService | null = null;

  private constructor() {
    super();
    logger.info('EventBusService initialized');
  }

  public static getInstance(): EventBusService {
    if (!EventBusService.instance) {
      EventBusService.instance = new EventBusService();
    }
    return EventBusService.instance;
  }

  public async publishEvent<T extends AppEvent>(event: T): Promise<void> {
    try {
      // Add timestamp if not present
      if (!event.timestamp) {
        event.timestamp = Date.now();
      }

      // Validate event type
      if (!Object.values(EventType).includes(event.type as EventType)) {
        throw new Error(`Invalid event type: ${event.type}`);
      }

      await this.emit(event);
    } catch (error: unknown) {
      logger.error('Error publishing event:', { error, event });
      throw error;
    }
  }

  public subscribeToEvent<T extends AppEvent>(
    type: EventType,
    handler: (event: T) => Promise<void>
  ): void {
    try {
      this.subscribe(type, handler);
      logger.debug('Subscribed to event:', { type });
    } catch (error: unknown) {
      logger.error('Error subscribing to event:', { error, type });
      throw error;
    }
  }

  public unsubscribeFromEvent<T extends AppEvent>(
    type: EventType,
    handler: (event: T) => Promise<void>
  ): void {
    try {
      this.unsubscribe(type, handler);
      logger.debug('Unsubscribed from event:', { type });
    } catch (error: unknown) {
      logger.error('Error unsubscribing from event:', { error, type });
      throw error;
    }
  }

  // Helper method to create events with proper typing
  public static createEvent<T extends AppEvent>(
    type: EventType,
    payload: T['payload'],
    source: string
  ): T {
    return {
      type,
      payload,
      timestamp: Date.now(),
      source
    } as T;
  }
} 