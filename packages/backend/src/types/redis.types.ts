export interface RedisAlert {
  type: 'connection' | 'memory' | 'latency' | 'error';
  message: string;
  timestamp: number;
  metrics?: {
    [key: string]: number | string | boolean;
  };
}

export interface RedisMetrics {
  isConnected: boolean;
  memoryUsage?: number;
  operationLatency?: number;
  errorRate?: number;
  lastUpdate: number;
} 