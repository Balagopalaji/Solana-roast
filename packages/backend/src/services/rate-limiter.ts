import NodeCache from 'node-cache';

export class RateLimiter {
  private cache: NodeCache;
  private readonly DAILY_LIMIT = 300;
  private readonly HOURLY_LIMIT = 50;
  
  constructor() {
    this.cache = new NodeCache();
  }

  async checkLimit(key: string): Promise<boolean> {
    const daily = this.cache.get<number>(`${key}_daily`) || 0;
    const hourly = this.cache.get<number>(`${key}_hourly`) || 0;

    if (daily >= this.DAILY_LIMIT || hourly >= this.HOURLY_LIMIT) {
      return false;
    }

    this.cache.set(`${key}_daily`, daily + 1, 86400); // 24 hours
    this.cache.set(`${key}_hourly`, hourly + 1, 3600); // 1 hour

    return true;
  }
}

export const rateLimiter = new RateLimiter(); 