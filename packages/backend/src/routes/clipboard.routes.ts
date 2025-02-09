import { Router } from 'express';
import logger from '../utils/logger';

const router = Router();

router.get('/fetch-image', async (req, res) => {
  const imageUrl = req.query.url as string;

  if (!imageUrl) {
    logger.error('No image URL provided');
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    logger.debug('Fetching image from URL:', imageUrl);
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('The URL does not point to a valid image');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    logger.debug('Image successfully fetched and converted to base64');

    return res.json({
      data: `data:${contentType};base64,${base64}`,
    });
  } catch (error) {
    logger.error('Error fetching image:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'An unknown error occurred while fetching the image',
    });
  }
});

export default router; 