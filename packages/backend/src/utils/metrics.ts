import { performance } from 'perf_hooks';
import { ErrorCategory, AppError } from '../types/errors';

export interface MetricData {
  count: number;
  totalTime: number;
  errors: number;
  lastTimestamp: number;
  errorTypes: Record<ErrorCategory, number>;
  lastError?: {
    message: string;
    category: ErrorCategory;
    timestamp: number;
  };
  successCount: number;
  averageResponseTime: number;
  _flushedAt?: number;
}

export class MetricsCollector {
  private metrics: Map<string, MetricData> = new Map();
  private readonly sampleRate: number;
  private readonly flushInterval: number;
  private flushTimer?: NodeJS.Timeout;

  constructor(options: { sampleRate: number; flushInterval: number }) {
    this.sampleRate = options.sampleRate || 1.0; // Default to collecting all metrics
    this.flushInterval = options.flushInterval || 60000; // Default to 1 minute
    this.startPeriodicFlush();
  }

  private startPeriodicFlush(): void {
    // Clear any existing timer first to prevent memory leaks
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      try {
        this.flush();
      } catch (error) {
        console.error('Error during metrics flush:', error);
        // Don't let flush errors crash the timer
      }
    }, this.flushInterval) as NodeJS.Timeout;

    // Ensure the timer doesn't prevent Node from exiting
    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }

  private flush(): void {
    const currentTime = Date.now();
    const metricsData: Record<string, MetricData> = {};

    this.metrics.forEach((data, name) => {
      // Now TypeScript knows about _flushedAt
      metricsData[name] = {
        ...data,
        _flushedAt: currentTime
      };
      
      // Reset counters but preserve error types and last error
      this.metrics.set(name, {
        ...data,
        count: 0,
        totalTime: 0,
        errors: 0,
        successCount: 0,
        lastTimestamp: currentTime
      });
    });

    // TODO: Replace console.log with actual metrics reporting
    if (Object.keys(metricsData).length > 0) {
      console.log('Metrics flush:', metricsData);
    }
  }

  recordSuccess(name: string, duration: number): void {
    const metric = this.getOrCreateMetric(name);
    metric.count++;
    metric.successCount++;
    metric.totalTime += duration;
    metric.averageResponseTime = metric.totalTime / metric.count;
    metric.lastTimestamp = Date.now();
  }

  async trackAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    // Only track based on sample rate
    if (Math.random() > this.sampleRate) {
      return operation();
    }

    const start = performance.now();
    try {
      const result = await operation();
      this.recordSuccess(name, performance.now() - start);
      return result;
    } catch (error) {
      // Convert unknown error to Error type
      const errorToRecord = error instanceof Error ? error : new Error(
        typeof error === 'string' ? error : 'Unknown error occurred'
      );
      
      this.recordError(name, errorToRecord, performance.now() - start);
      throw error; // Re-throw the original error
    }
  }

  recordError(name: string, error: Error, duration: number) {
    const metric = this.getOrCreateMetric(name);
    const category = this.categorizeError(error);
    
    metric.errors++;
    metric.errorTypes[category]++;
    metric.lastError = {
      message: error.message,
      category,
      timestamp: Date.now()
    };

    if (this.shouldTriggerAlert(metric)) {
      this.notifyErrorThreshold(name, metric);
    }
  }

  private getOrCreateMetric(name: string): MetricData {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        count: 0,
        totalTime: 0,
        errors: 0,
        lastTimestamp: Date.now(),
        errorTypes: Object.values(ErrorCategory).reduce((acc, category) => {
          acc[category] = 0;
          return acc;
        }, {} as Record<ErrorCategory, number>),
        successCount: 0,
        averageResponseTime: 0
      });
    }
    return this.metrics.get(name)!;
  }

  private categorizeError(error: Error): ErrorCategory {
    if (error instanceof AppError) {
      return error.metadata.category;
    }

    if (error.name === 'NetworkError') return ErrorCategory.NETWORK;
    if (error.name === 'TimeoutError') return ErrorCategory.TIMEOUT;
    if (error.message.includes('rate limit')) return ErrorCategory.RATE_LIMIT;
    return ErrorCategory.UNKNOWN;
  }

  private shouldTriggerAlert(metric: MetricData): boolean {
    const ERROR_THRESHOLD = 0.1; // 10% error rate
    const errorRate = metric.errors / metric.count;
    return errorRate > ERROR_THRESHOLD;
  }

  private notifyErrorThreshold(name: string, metric: MetricData) {
    console.warn(`High error rate detected for ${name}:`, {
      errorRate: (metric.errors / metric.count).toFixed(2),
      details: metric.lastError
    });
    // TODO: Add proper alerting integration
  }

  // Cleanup method
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }
}

// Create singleton instance
export const metrics = new MetricsCollector({
  sampleRate: process.env.METRICS_SAMPLE_RATE ? 
    parseFloat(process.env.METRICS_SAMPLE_RATE) : 1.0,
  flushInterval: process.env.METRICS_FLUSH_INTERVAL ? 
    parseInt(process.env.METRICS_FLUSH_INTERVAL) : 60000
}); 