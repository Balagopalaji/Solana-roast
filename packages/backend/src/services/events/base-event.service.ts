import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import logger from '../../utils/logger';

export interface AppEvent<TPayload = unknown> {
  type: string;
  payload: TPayload;
  timestamp: number;
  source: string;
}

export type EventHandler<T = unknown> = (event: AppEvent<T>) => Promise<void> | void;

export abstract class BaseEventService extends EventEmitter {
  protected redis: Redis | null = null;
  protected subscribers: Map<string, EventHandler[]> = new Map();
  protected initialized = false;

  constructor() {
    super();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.on('error', (error: Error) => {
      logger.error('Event service error:', error);
    });
  }

  protected abstract handleEvent(event: AppEvent): Promise<void>;

  // Override the emit method from EventEmitter
  public emit(eventName: string | symbol, ...args: any[]): boolean;
  public emit(event: AppEvent): boolean;
  public emit(eventOrName: string | symbol | AppEvent, ...args: any[]): boolean {
    // If it's an AppEvent, process it
    if (typeof eventOrName === 'object' && 'type' in eventOrName) {
      this.processAppEvent(eventOrName).catch(error => {
        logger.error('Failed to process app event:', error);
        super.emit('error', error);
      });
      return true;
    }
    
    // Otherwise, use standard EventEmitter emit
    return super.emit(eventOrName, ...args);
  }

  private async processAppEvent(event: AppEvent): Promise<void> {
    try {
      // Local event processing
      await this.processEvent(event);

      // Distributed event processing (if Redis is available)
      if (this.redis) {
        await this.redis.publish('app_events', JSON.stringify(event));
      }

      // Emit to any local subscribers using standard EventEmitter
      super.emit(event.type, event);
    } catch (error) {
      logger.error('Failed to emit event:', error);
      throw error;
    }
  }

  protected async processEvent(event: AppEvent): Promise<void> {
    try {
      await this.handleEvent(event);

      // Process subscribers
      const handlers = this.subscribers.get(event.type);
      if (handlers) {
        await Promise.all(handlers.map(handler => handler(event)));
      }
    } catch (error) {
      logger.error('Failed to process event:', error);
      throw error;
    }
  }

  public subscribe(eventType: string, handler: EventHandler): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)?.push(handler);
  }

  public unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.subscribers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
} 