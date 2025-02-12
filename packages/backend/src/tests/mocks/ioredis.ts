import { Redis } from 'ioredis';
import { EventEmitter } from 'events';

// Create a base mock that extends EventEmitter
class MockRedisBase extends EventEmitter {
  constructor() {
    super();
  }
}

export const createMockRedisClient = () => {
  // Create base instance with EventEmitter functionality
  const base = new MockRedisBase();
  
  const mockClient = {
    // Inherit EventEmitter methods
    ...base,
    
    // Basic operations
    quit: jest.fn().mockResolvedValue('OK'),
    ping: jest.fn().mockResolvedValue('PONG'),
    info: jest.fn().mockResolvedValue('used_memory:1024\nmaxmemory:2048'),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue(['key1', 'key2']),
    ttl: jest.fn().mockResolvedValue(3600),
    expire: jest.fn().mockResolvedValue(1),

    // Sorted set operations
    zadd: jest.fn().mockResolvedValue(1),
    zrevrange: jest.fn().mockResolvedValue(['member1', 'member2']),
    zscore: jest.fn().mockResolvedValue('100'),
    zcard: jest.fn().mockResolvedValue(2),

    // Hash operations
    hincrby: jest.fn().mockResolvedValue(1),
    hgetall: jest.fn().mockResolvedValue({ field1: 'value1', field2: 'value2' }),

    // Transaction operations
    multi: jest.fn(function(this: any) { return this; }),
    exec: jest.fn().mockResolvedValue([])
  };

  // Add chainable mock implementation
  (mockClient as any).mockImplementation(() => mockClient);
  
  return mockClient as unknown as jest.Mocked<Redis>;
};

export const mockRedisClient = createMockRedisClient(); 