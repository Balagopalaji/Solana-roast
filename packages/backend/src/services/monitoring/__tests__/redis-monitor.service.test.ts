import { RedisMonitorService, RedisAlert } from '../redis-monitor.service';
import { redisService } from '../../storage/redis.service';
import logger from '../../../utils/logger';

// Mock dependencies
jest.mock('../../storage/redis.service');
jest.mock('../../../utils/logger');

describe('RedisMonitorService', () => {
  let monitorService: RedisMonitorService;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    // Reset environment variables
    process.env.REDIS_MONITOR_ENABLED = 'true';
    process.env.REDIS_MONITOR_INTERVAL = '1000';
    process.env.REDIS_ALERT_THRESHOLD_MEMORY = '80';
    process.env.REDIS_ALERT_THRESHOLD_LATENCY = '100';
    process.env.REDIS_ALERT_THRESHOLD_ERRORS = '10';
    // Get fresh instance
    monitorService = RedisMonitorService.getInstance();
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
      expect(redisService.on).toHaveBeenCalledWith('metrics', expect.any(Function));
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
    let alerts: RedisAlert[] = [];

    beforeEach(() => {
      alerts = [];
      monitorService.onAlert((alert) => alerts.push(alert));
    });

    it('should emit connection alerts', () => {
      monitorService.start();
      const metrics = {
        connectionStatus: 'error',
        operationLatency: 0,
        totalOperations: 0,
        failedOperations: 0
      };

      // @ts-ignore - Emit metrics directly for testing
      redisService.emit('metrics', metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'connection',
        message: expect.stringContaining('error')
      });
    });

    it('should emit memory alerts', () => {
      monitorService.start();
      const metrics = {
        connectionStatus: 'connected',
        operationLatency: 0,
        memoryUsage: 1024 * 1024 * 100, // 100MB
        totalOperations: 0,
        failedOperations: 0
      };

      // @ts-ignore - Emit metrics directly for testing
      redisService.emit('metrics', metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'memory',
        message: expect.stringContaining('memory usage')
      });
    });

    it('should emit latency alerts', () => {
      monitorService.start();
      const metrics = {
        connectionStatus: 'connected',
        operationLatency: 150,
        totalOperations: 0,
        failedOperations: 0
      };

      // @ts-ignore - Emit metrics directly for testing
      redisService.emit('metrics', metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'latency',
        message: expect.stringContaining('latency')
      });
    });

    it('should emit error rate alerts', () => {
      monitorService.start();
      const metrics1 = {
        connectionStatus: 'connected',
        operationLatency: 0,
        totalOperations: 100,
        failedOperations: 0
      };

      const metrics2 = {
        connectionStatus: 'connected',
        operationLatency: 0,
        totalOperations: 200,
        failedOperations: 15
      };

      // @ts-ignore - Emit metrics directly for testing
      redisService.emit('metrics', metrics1);
      redisService.emit('metrics', metrics2);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'errors',
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