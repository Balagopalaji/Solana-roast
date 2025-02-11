import { Redis } from 'ioredis';
import logger from '../../utils/logger';

export interface AppEvent<T = any> {
  type: string;
  payload: T;
  timestamp: number;
  source: string;
}

export abstract class BaseEventService {
  protected redis: Redis;
  protected subscribers: Map<string, Function[]>;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.subscribers = new Map();
    this.setupRedisSubscriber();
  }

  private async setupRedisSubscriber(): Promise<void> {
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe('app_events');
    
    subscriber.on('message', async (channel: string, message: string) => {
      try {
        const event = JSON.parse(message) as AppEvent;
        await this.processEvent(event);
      } catch (error: unknown) {
        logger.error('Error processing event:', error);
      }
    });
  }

  protected async processEvent(event: AppEvent): Promise<void> {
    const subscribers = this.subscribers.get(event.type) || [];
    await Promise.all(
      subscribers.map(handler => 
        handler(event).catch((error: unknown) => 
          logger.error('Error in event handler:', { error, event })
        )
      )
    );
  }

  public async emit(event: AppEvent): Promise<void> {
    try {
      // Local processing
      await this.processEvent(event);
      
      // Distributed processing
      await this.redis.publish('app_events', JSON.stringify(event));
      
      logger.debug('Event emitted:', { type: event.type, source: event.source });
    } catch (error: unknown) {
      logger.error('Error emitting event:', { error, event });
      throw error;
    }
  }

  public subscribe(type: string, handler: Function): void {
    const handlers = this.subscribers.get(type) || [];
    this.subscribers.set(type, [...handlers, handler]);
    logger.debug('Event handler subscribed:', { type });
  }

  public unsubscribe(type: string, handler: Function): void {
    const handlers = this.subscribers.get(type) || [];
    this.subscribers.set(
      type,
      handlers.filter(h => h !== handler)
    );
    logger.debug('Event handler unsubscribed:', { type });
  }
} 