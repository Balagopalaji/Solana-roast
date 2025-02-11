import logger from '../../utils/logger';

export interface StorageConfig {
  prefix?: string;
  ttl?: number;
  encryption?: boolean;
}

export abstract class BaseStorageService<T> {
  protected prefix: string;
  protected ttl?: number;

  constructor(config: StorageConfig = {}) {
    this.prefix = config.prefix || '';
    this.ttl = config.ttl;
  }

  protected getKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  abstract get(key: string): Promise<T | null>;
  abstract set(key: string, value: T): Promise<void>;
  abstract list(pattern: string): Promise<T[]>;
  abstract delete(key: string): Promise<void>;

  protected logOperation(operation: string, key: string, error?: unknown): void {
    if (error) {
      logger.error(`Storage operation ${operation} failed:`, {
        key: this.getKey(key),
        error
      });
    } else {
      logger.debug(`Storage operation ${operation} completed:`, {
        key: this.getKey(key)
      });
    }
  }

  protected async validateValue(value: T): Promise<boolean> {
    if (value === null || value === undefined) {
      throw new Error('Cannot store null or undefined values');
    }
    return true;
  }

  protected async validateKey(key: string): Promise<boolean> {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key: must be a non-empty string');
    }
    return true;
  }
} 