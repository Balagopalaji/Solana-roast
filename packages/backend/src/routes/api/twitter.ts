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
    
    // First download the image to our server
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Then use the service to handle the Twitter API calls
    const tweetId = await twitterService.uploadImageAndTweet(
      imageBuffer,
      text || '🔥',
      url
    );

    return res.json({ 
      success: true,
      tweetId 
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