interface RetryConfig {
  maxRetries?: number;
  delayMs?: number;
  shouldRetry?: (error: any) => boolean;
}

export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    shouldRetry = (error) => {
      // Retry on network errors and 5xx responses
      return !error.response || (error.response.status >= 500 && error.response.status < 600);
    }
  } = config;

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      
      if (!shouldRetry(error) || attempt === maxRetries - 1) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
    }
  }

  throw lastError;
} 