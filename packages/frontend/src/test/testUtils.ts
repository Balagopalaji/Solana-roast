import { render, RenderOptions, waitFor, act, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';

interface TestSetupResult {
  cleanup: () => void;
  advanceTimers: (ms?: number) => Promise<void>;
}

export const setupTest = (): TestSetupResult => {
  vi.useFakeTimers();
  return {
    cleanup: () => {
      vi.useRealTimers();
      vi.clearAllMocks();
    },
    advanceTimers: async (ms = 0) => {
      await vi.advanceTimersByTimeAsync(ms);
    }
  };
};

interface RenderWithTimersResult extends ReturnType<typeof render> {
  cleanup: () => void;
  advanceTimers: (ms?: number) => Promise<void>;
  userEvent: {
    click: (element: HTMLElement) => Promise<void>;
    waitForLoadingState: (element: HTMLElement, text: RegExp) => Promise<void>;
    waitForText: (text: RegExp | string) => Promise<HTMLElement>;
  };
}

export const renderWithTimers = (
  component: React.ReactElement,
  options?: RenderOptions
): RenderWithTimersResult => {
  vi.useFakeTimers();
  const utils = render(component, options);
  
  return {
    ...utils,
    advanceTimers: async (ms: number) => {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
      });
    },
    userEvent: {
      click: async (element: HTMLElement) => {
        await act(async () => {
          fireEvent.click(element);
          await vi.advanceTimersByTimeAsync(50);
        });
      },
      waitForLoadingState: async (element: HTMLElement, text: RegExp) => {
        await waitFor(
          () => expect(element).toHaveTextContent(text),
          { timeout: 1000 }
        );
      },
      waitForText: async (text: RegExp | string) => {
        return await waitFor(
          () => utils.getByText(text),
          { timeout: 1000 }
        );
      }
    },
    cleanup: () => {
      vi.useRealTimers();
      vi.clearAllMocks();
    }
  };
}; 