import { Router, Request } from 'express';
import { twitterService } from '../services/twitter.service';
import multer from 'multer';
import logger from '../utils/logger';
import { Multer } from 'multer';

// Extend Express Request type to include file from multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const router = Router();
const upload = multer();

router.post('/tweet', upload.single('image'), async (req: MulterRequest, res) => {
  try {
    // Check if Twitter service is enabled
    if (!twitterService.isEnabled()) {
      return res.status(503).json({ 
        success: false,
        error: 'Twitter sharing is not available' 
      });
    }

    const { text, url } = req.body;
    const imageBuffer = req.file?.buffer;

    if (!imageBuffer) {
      logger.warn('No image provided in request');
      return res.status(400).json({ 
        success: false,
        error: 'Image is required' 
      });
    }

    if (!text || !url) {
      logger.warn('Missing text or URL in request');
      return res.status(400).json({ 
        success: false,
        error: 'Text and URL are required' 
      });
    }

    const tweetId = await twitterService.uploadImageAndTweet(imageBuffer, text, url);
    res.json({ 
      success: true, 
      tweetId,
      tweetUrl: `https://twitter.com/i/web/status/${tweetId}`
    });
  } catch (error) {
    logger.error('Tweet posting error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to post tweet' 
    });
  }
});

export default router; 