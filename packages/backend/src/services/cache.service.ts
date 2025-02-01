import NodeCache from 'node-cache';

export class CacheService {
  private cache: NodeCache;

  constructor(ttlSeconds: number = 300) { // 5 minutes default
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds * 0.2,
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get(key);
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
  }
}

export const cacheService = new CacheService(); 