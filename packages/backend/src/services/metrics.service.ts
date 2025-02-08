import logger from '../utils/logger';

interface MetricEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

interface ErrorEvent {
  error: Error;
  context: string;
  severity?: 'error' | 'warning' | 'info';
}

export class MetricsService {
  trackEvent(eventName: string, event: MetricEvent): void {
    if (process.env.ENABLE_METRICS !== 'true') {
      return;
    }

    logger.debug('Tracking event:', {
      name: eventName,
      ...event
    });
  }

  trackError(error: Error, event: Omit<ErrorEvent, 'error'>): void {
    if (process.env.ENABLE_METRICS !== 'true') {
      return;
    }

    logger.error('Error tracked:', {
      error: error.message,
      stack: error.stack,
      ...event
    });
  }
}

export const metricsService = new MetricsService(); 