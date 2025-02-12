import { jest, beforeEach, afterAll } from '@jest/globals';

// Configure test environment
process.env.NODE_ENV = 'test';

// Mock timers
jest.useFakeTimers();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  jest.useRealTimers();
}); 