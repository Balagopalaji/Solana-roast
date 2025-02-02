import { performance } from 'perf_hooks';

export interface MetricData {
  count: number;
  totalTime: number;
  errors: number;
  lastTimestamp: number;
}

export class MetricsCollector {
  private metrics: Map<string, MetricData> = new Map();
  private readonly sampleRate: number;
  private readonly flushInterval: number;

  constructor(options: { sampleRate: number; flushInterval: number }) {
    this.sampleRate = options.sampleRate;
    this.flushInterval = options.flushInterval;
    this.startPeriodicFlush();
  }

  async trackAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      this.recordSuccess(name, performance.now() - start);
      return result;
    } catch (error) {
      this.recordError(name, error, performance.now() - start);
      throw error;
    }
  }

  // ... more methods to follow
} 