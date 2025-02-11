import { Router } from 'express';
import logger from '../../utils/logger';
import { twitterService } from '../../services/twitter.service';

// Add debug logging
logger.info('Initializing Twitter routes');

const router = Router();

// Add route logging
router.use((req, res, next) => {
  logger.debug('Twitter route accessed:', {
    method: req.method,
    path: req.path
  });
  next();
});

router.post('/test-upload', async (req, res) => {
  logger.info('Received test upload request', { 
    imageUrl: req.body.imageUrl,
    hasTwitterService: !!twitterService,
    isInitialized: twitterService.isInitialized()
  });

  const { imageUrl } = req.body;
  
  if (!imageUrl) {
    logger.warn('No image URL provided');
    return res.status(400).json({ error: 'Image URL required' });
  }

  if (!twitterService.isInitialized()) {
    logger.error('Twitter service not initialized', {
      hasApiKey: !!process.env.TWITTER_API_KEY,
      hasApiSecret: !!process.env.TWITTER_API_SECRET,
      hasAccessToken: !!process.env.TWITTER_ACCESS_TOKEN,
      hasAccessSecret: !!process.env.TWITTER_ACCESS_SECRET
    });
    return res.status(503).json({ 
      error: 'Twitter service not properly initialized',
      success: false 
    });
  }

  try {
    const success = await twitterService.testImageUpload(imageUrl);
    logger.info('Test upload result:', { success });
    res.json({ success });
  } catch (error) {
    logger.error('Twitter upload test failed:', error);
    res.status(500).json({ 
      error: 'Twitter upload test failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

router.post('/tweet', async (req, res) => {
  try {
    const { imageUrl, text, url } = req.body;
    
    // Get detailed status
    const status = await twitterService.getStatus();
    
    if (!twitterService.isInitialized()) {
      logger.error('Twitter service not initialized:', status);
      
      // Special handling for development mode
      if (process.env.NODE_ENV === 'development') {
        return res.status(503).json({ 
          error: 'Twitter service not properly initialized',
          success: false,
          details: {
            status,
            message: 'Development Mode Setup Required:',
            steps: [
              '1. Copy the ngrok URL from the console',
              '2. Go to Twitter Developer Portal: https://developer.twitter.com/en/portal/dashboard',
              '3. Update Website URL to: https://{ngrok-id}.ngrok-free.app',
              '4. Update Callback URL to: https://{ngrok-id}.ngrok-free.app/api/twitter/callback',
              '5. Restart the server after updating the URLs'
            ]
          }
        });
      }
      
      // Production error
      return res.status(503).json({ 
        error: 'Twitter service not properly initialized',
        success: false,
        details: {
          status,
          message: 'Please check Twitter API credentials and permissions'
        }
      });
    }

    // Then use the service to handle the Twitter API calls
    const tweetUrl = await twitterService.shareWithMedia(
      `${text || '🔥'}\n\nRoast your wallet at ${url} 🔥`,
      imageUrl,
      'dev-account' // Using dev account for now
    );

    return res.json({ 
      success: true,
      tweetUrl 
    });
  } catch (error) {
    logger.error('Error posting tweet:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to post tweet',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Add this temporary debug route
router.get('/status', (req, res) => {
  const credentials = {
    hasApiKey: !!process.env.TWITTER_API_KEY,
    hasApiSecret: !!process.env.TWITTER_API_SECRET,
    hasAccessToken: !!process.env.TWITTER_ACCESS_TOKEN,
    hasAccessSecret: !!process.env.TWITTER_ACCESS_SECRET
  };
  
  res.json({
    credentials,
    isInitialized: twitterService.isInitialized()
  });
});

// Add a simple test route
router.get('/test', (req, res) => {
  res.json({
    message: 'Twitter routes working',
    path: req.path,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl
  });
});

export default router; 