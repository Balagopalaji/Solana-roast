import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { RedisMonitorService } from '../redis-monitor.service';
import { RedisService } from '../../storage/redis.service';
import { RedisAlert, RedisMetrics } from '../../../types/redis.types';
import logger from '../../../utils/logger';

// Mock dependencies
jest.mock('../../storage/redis.service');
jest.mock('../../../utils/logger');

describe('RedisMonitorService', () => {
  let monitorService: RedisMonitorService;
  let alerts: RedisAlert[] = [];
  let redisService: RedisService;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    // Reset environment variables
    process.env.REDIS_MONITOR_ENABLED = 'true';
    process.env.REDIS_MONITOR_INTERVAL = '1000';
    process.env.REDIS_ALERT_THRESHOLD_MEMORY = '80';
    process.env.REDIS_ALERT_THRESHOLD_LATENCY = '100';
    process.env.REDIS_ALERT_THRESHOLD_ERRORS = '10';
    // Get fresh instances
    monitorService = RedisMonitorService.getInstance();
    redisService = RedisService.getInstance();
    // Reset alerts array
    alerts = [];
    monitorService.on('alert', (alert: RedisAlert) => alerts.push(alert));
  });

  afterEach(() => {
    monitorService.stop();
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = RedisMonitorService.getInstance();
      const instance2 = RedisMonitorService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('start', () => {
    it('should not start if monitoring is disabled', () => {
      process.env.REDIS_MONITOR_ENABLED = 'false';
      monitorService = RedisMonitorService.getInstance();
      monitorService.start();
      expect(logger.info).toHaveBeenCalledWith('Redis monitoring is disabled');
    });

    it('should start monitoring and subscribe to metrics', () => {
      monitorService.start();
      expect(RedisService.getInstance().on).toHaveBeenCalledWith('metrics', expect.any(Function));
      expect(logger.info).toHaveBeenCalledWith(
        'Starting Redis monitoring',
        expect.any(Object)
      );
    });

    it('should not start multiple times', () => {
      monitorService.start();
      monitorService.start();
      expect(logger.warn).toHaveBeenCalledWith('Redis monitoring is already running');
    });
  });

  describe('alerts', () => {
    it('should emit connection alerts', () => {
      monitorService.start();
      const metrics: RedisMetrics = {
        isConnected: false,
        operationLatency: 0,
        errorRate: 0,
        lastUpdate: Date.now()
      };

      redisService.emit('metrics', metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'connection',
        message: expect.stringContaining('connection')
      });
    });

    it('should emit memory alerts', () => {
      monitorService.start();
      const metrics: RedisMetrics = {
        isConnected: true,
        memoryUsage: 0.85, // 85% usage
        operationLatency: 0,
        errorRate: 0,
        lastUpdate: Date.now()
      };

      redisService.emit('metrics', metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'memory',
        message: expect.stringContaining('memory')
      });
    });

    it('should emit latency alerts', () => {
      monitorService.start();
      const metrics: RedisMetrics = {
        isConnected: true,
        operationLatency: 150, // 150ms
        errorRate: 0,
        lastUpdate: Date.now()
      };

      redisService.emit('metrics', metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'latency',
        message: expect.stringContaining('latency')
      });
    });

    it('should emit error rate alerts', () => {
      monitorService.start();
      const metrics1: RedisMetrics = {
        isConnected: true,
        operationLatency: 0,
        errorRate: 0,
        lastUpdate: Date.now()
      };

      const metrics2: RedisMetrics = {
        isConnected: true,
        operationLatency: 0,
        errorRate: 0.15, // 15% error rate
        lastUpdate: Date.now()
      };

      redisService.emit('metrics', metrics1);
      redisService.emit('metrics', metrics2);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'error',
        message: expect.stringContaining('error rate')
      });
    });
  });

  describe('stop', () => {
    it('should stop monitoring', () => {
      monitorService.start();
      monitorService.stop();
      expect(logger.info).toHaveBeenCalledWith('Redis monitoring stopped');
    });

    it('should handle multiple stops gracefully', () => {
      monitorService.start();
      monitorService.stop();
      monitorService.stop();
      expect(logger.info).toHaveBeenCalledTimes(2); // Start and first stop
    });
  });
}); 