import { EventEmitter } from 'events';
import { RedisService } from '../storage/redis.service';
import { RedisAlert, RedisMetrics } from '../../types/redis.types';
import logger from '../../utils/logger';

export class RedisMonitorService extends EventEmitter {
  private static instance: RedisMonitorService;
  private monitorInterval: NodeJS.Timeout | null = null;
  private readonly checkInterval = 60000; // 1 minute
  private readonly thresholds = {
    memory: 0.8, // 80% of max memory
    latency: 100, // 100ms
    errorRate: 0.1 // 10% error rate
  };

  private constructor() {
    super();
  }

  public static getInstance(): RedisMonitorService {
    if (!RedisMonitorService.instance) {
      RedisMonitorService.instance = new RedisMonitorService();
    }
    return RedisMonitorService.instance;
  }

  public start(): void {
    if (this.monitorInterval) {
      logger.warn('Redis monitoring is already running');
      return;
    }

    logger.info('Starting Redis monitoring');
    this.monitorInterval = setInterval(() => this.checkMetrics(), this.checkInterval);
    this.checkMetrics(); // Initial check
  }

  public stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      logger.info('Redis monitoring stopped');
    }
  }

  public getMetrics(): RedisMetrics {
    const redis = RedisService.getInstance();
    const metrics = redis.getMetrics();

    return {
      isConnected: metrics.isConnected,
      memoryUsage: metrics.memoryUsage,
      operationLatency: metrics.operationLatency,
      errorRate: metrics.errorRate,
      lastUpdate: Date.now()
    };
  }

  private async checkMetrics(): Promise<void> {
    try {
      const metrics = this.getMetrics();

      // Check connection status
      if (!metrics.isConnected) {
        this.emitAlert({
          type: 'connection',
          message: 'Redis connection lost',
          timestamp: Date.now()
        });
        return;
      }

      // Check memory usage
      if (metrics.memoryUsage && metrics.memoryUsage > this.thresholds.memory) {
        this.emitAlert({
          type: 'memory',
          message: `High memory usage: ${(metrics.memoryUsage * 100).toFixed(1)}%`,
          timestamp: Date.now(),
          metrics: {
            memoryUsage: metrics.memoryUsage
          }
        });
      }

      // Check latency
      if (metrics.operationLatency && metrics.operationLatency > this.thresholds.latency) {
        this.emitAlert({
          type: 'latency',
          message: `High latency: ${metrics.operationLatency.toFixed(1)}ms`,
          timestamp: Date.now(),
          metrics: {
            latency: metrics.operationLatency
          }
        });
      }

      // Check error rate
      if (metrics.errorRate && metrics.errorRate > this.thresholds.errorRate) {
        this.emitAlert({
          type: 'error',
          message: `High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
          timestamp: Date.now(),
          metrics: {
            errorRate: metrics.errorRate
          }
        });
      }
    } catch (error) {
      logger.error('Failed to check Redis metrics:', error);
    }
  }

  private emitAlert(alert: RedisAlert): void {
    this.emit('alert', alert);
    logger.warn('Redis alert:', alert);
  }
}

// Export singleton instance
export const redisMonitor = RedisMonitorService.getInstance(); 