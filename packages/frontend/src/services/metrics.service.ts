import { FEATURES } from '../config/features';

type MetricEvent = {
  category: 'roast' | 'share' | 'wallet' | 'error' | 'performance';
  action: string;
  label?: string;
  value?: number;
};

type ErrorEvent = {
  error: Error;
  context: string;
  metadata?: Record<string, any>;
};

class MetricsService {
  private static instance: MetricsService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  initialize() {
    if (this.isInitialized) return;
    
    // Development initialization
    if (import.meta.env.DEV) {
      this.setupErrorTracking();
      this.setupPerformanceTracking();
    }
    
    this.isInitialized = true;
  }

  trackEvent({ category, action, label, value }: MetricEvent) {
    if (!FEATURES.METRICS.ENABLED) return;

    // Don't track cancelled share attempts
    if (category === 'share' && label?.includes('cancelled')) {
      return;
    }

    // For now, just log in development
    if (import.meta.env.DEV) {
      console.log(`[Metric] ${category}:${action}`, { label, value });
    }
    // We'll add production metrics integration later
  }

  trackError({ error, context, metadata }: ErrorEvent) {
    if (!FEATURES.METRICS.ERROR_TRACKING) return;

    console.error(`[Error] ${context}:`, error, metadata);
  }

  private setupErrorTracking() {
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        error: event.reason,
        context: 'unhandledrejection'
      });
    });

    window.addEventListener('error', (event) => {
      this.trackError({
        error: event.error,
        context: 'window.error'
      });
    });
  }

  private setupPerformanceTracking() {
    if (!FEATURES.METRICS.PERFORMANCE) return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.trackEvent({
        category: 'performance',
        action: 'page_load',
        value: navigation.loadEventEnd - navigation.startTime
      });
    });
  }
}

export const metrics = MetricsService.getInstance(); 