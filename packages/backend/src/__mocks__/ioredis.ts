import { mockRedisClient } from '../tests/mocks/ioredis';

const Redis = jest.fn(() => mockRedisClient);

export { Redis };
export default Redis; 