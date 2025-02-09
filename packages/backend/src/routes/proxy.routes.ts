import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    // Verify the URL is from imgflip
    if (!url.startsWith('https://i.imgflip.com/')) {
      return res.status(400).json({ error: "Only imgflip URLs are allowed" });
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // Forward the content type
    const contentType = response.headers.get('content-type');
    res.set('Content-Type', contentType || 'image/jpeg');
    
    // Pipe the response directly
    response.body.pipe(res);

  } catch (error) {
    console.error('Error in proxy route:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch image' 
    });
  }
});

export default router; 