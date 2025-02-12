import { Redis, RedisKey, Callback, ChainableCommander } from 'ioredis';
import { EventEmitter } from 'events';
import { jest } from '@jest/globals';

// Create a base mock that extends EventEmitter
class MockRedisClient extends EventEmitter {
  // Basic operations
  quit = jest.fn().mockImplementation(() => Promise.resolve('OK'));
  ping = jest.fn().mockImplementation(() => Promise.resolve('PONG'));
  info = jest.fn().mockImplementation(() => Promise.resolve('used_memory:1024\nmaxmemory:2048'));
  get = jest.fn().mockImplementation(() => Promise.resolve(null));
  set = jest.fn().mockImplementation(() => Promise.resolve('OK'));
  del = jest.fn().mockImplementation(() => Promise.resolve(1));
  exists = jest.fn().mockImplementation(() => Promise.resolve(1));
  keys = jest.fn().mockImplementation(() => Promise.resolve(['key1', 'key2']));
  ttl = jest.fn().mockImplementation(() => Promise.resolve(3600));
  expire = jest.fn().mockImplementation(() => Promise.resolve(1));

  // Sorted set operations
  zadd = jest.fn().mockImplementation(() => Promise.resolve(1));
  zrevrange = jest.fn().mockImplementation(() => Promise.resolve(['member1', 'member2']));
  zscore = jest.fn().mockImplementation(() => Promise.resolve('100'));
  zcard = jest.fn().mockImplementation(() => Promise.resolve(2));

  // Hash operations
  hincrby = jest.fn().mockImplementation(() => Promise.resolve(1));
  hgetall = jest.fn().mockImplementation(() => Promise.resolve({ field1: 'value1', field2: 'value2' }));

  // Transaction operations
  multi() {
    return this as any;
  }
  exec = jest.fn().mockImplementation(() => Promise.resolve([[null, 'OK']]));
}

export const createMockRedisClient = (): jest.Mocked<Redis> => {
  return new MockRedisClient() as unknown as jest.Mocked<Redis>;
};

export const mockRedisClient = createMockRedisClient(); 