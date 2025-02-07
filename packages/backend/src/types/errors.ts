export enum ErrorCategory {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  VALIDATION = 'validation',
  INTEGRATION = 'integration',
  UNKNOWN = 'unknown'
}

export interface ErrorMetadata {
  category: ErrorCategory;
  retryable: boolean;
  context?: string;
  timestamp: number;
}

export class AppError extends Error {
  public readonly metadata: ErrorMetadata;

  constructor(message: string, metadata: Partial<ErrorMetadata>) {
    super(message);
    this.name = 'AppError';
    this.metadata = {
      category: metadata.category || ErrorCategory.UNKNOWN,
      retryable: metadata.retryable ?? false,
      context: metadata.context,
      timestamp: Date.now()
    };
  }
} 