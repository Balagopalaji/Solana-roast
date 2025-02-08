import { vi, describe, it, expect, beforeEach } from 'vitest';
import { metricsService } from '../metrics.service';

describe('MetricsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should track events when enabled', () => {
      const trackSpy = vi.spyOn(metricsService, 'trackEvent');
      
      metricsService.trackEvent('test_event', {
        category: 'test',
        action: 'test_action'
      });

      expect(trackSpy).toHaveBeenCalledWith('test_event', {
        category: 'test',
        action: 'test_action'
      });
    });

    it('should not track events when disabled', () => {
      const originalEnv = process.env.ENABLE_METRICS;
      process.env.ENABLE_METRICS = 'false';
      
      const trackSpy = vi.spyOn(metricsService, 'trackEvent');
      
      metricsService.trackEvent('test_event', {
        category: 'test',
        action: 'test_action'
      });

      expect(trackSpy).not.toHaveBeenCalled();
      
      process.env.ENABLE_METRICS = originalEnv;
    });
  });

  describe('trackError', () => {
    it('should track errors with correct format', () => {
      const trackSpy = vi.spyOn(metricsService, 'trackError');
      const testError = new Error('Test error');
      
      metricsService.trackError(testError, {
        context: 'test_context',
        severity: 'error'
      });

      expect(trackSpy).toHaveBeenCalledWith(testError, {
        context: 'test_context',
        severity: 'error'
      });
    });
  });
}); 