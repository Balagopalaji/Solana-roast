export * from './base-twitter.service';
export * from './dev-twitter.service';

import { DevTwitterService } from './dev-twitter.service';
import logger from '../../utils/logger';

// Create singleton instance
const devTwitterService = new DevTwitterService();

// Initialize immediately
(async () => {
  try {
    logger.info('Initializing dev Twitter service...');
    await devTwitterService.initialize();
    
    // Get and log status after initialization
    const status = await devTwitterService.getStatus();
    logger.info('Dev Twitter service status:', status);
    
    if (!status.initialized) {
      logger.error('Dev Twitter service failed to initialize properly. Check logs above for details.');
    }
  } catch (error) {
    logger.error('Failed to initialize dev Twitter service:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
})();

export { devTwitterService }; 