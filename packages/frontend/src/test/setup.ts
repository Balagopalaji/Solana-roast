import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Basic mocks
const setupGlobalMocks = () => {
  // Mock navigator APIs
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined)
    },
    share: vi.fn().mockResolvedValue(undefined)
  });

  // Mock window APIs
  vi.stubGlobal('open', vi.fn());

  // Mock URL APIs
  global.URL.createObjectURL = vi.fn(() => 'mock-url');
  global.URL.revokeObjectURL = vi.fn();
};

beforeEach(() => {
  setupGlobalMocks();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});