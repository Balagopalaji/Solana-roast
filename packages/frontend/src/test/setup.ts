import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from '@jest/globals';

// Mock clipboard API
Object.defineProperty(window.navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
  writable: true,
  configurable: true
});

// Mock Web Share API
Object.defineProperty(window.navigator, 'share', {
  value: jest.fn().mockImplementation(() => Promise.resolve()),
  writable: true,
  configurable: true
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});