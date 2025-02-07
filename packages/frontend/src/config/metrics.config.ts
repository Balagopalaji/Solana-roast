export const METRICS_CONFIG = {
  MIXPANEL_TOKEN: import.meta.env.VITE_MIXPANEL_TOKEN,
  ENVIRONMENT: import.meta.env.MODE,
  SAMPLING_RATE: 0.1, // Sample 10% of performance metrics
  ERROR_SAMPLING_RATE: 1.0, // Capture all errors
} as const;

export type MetricsProvider = 'mixpanel' | 'console' | 'disabled';

export const getMetricsProvider = (): MetricsProvider => {
  if (!FEATURES.METRICS.ENABLED) return 'disabled';
  if (import.meta.env.DEV) return 'console';
  if (METRICS_CONFIG.MIXPANEL_TOKEN) return 'mixpanel';
  return 'disabled';
}; 