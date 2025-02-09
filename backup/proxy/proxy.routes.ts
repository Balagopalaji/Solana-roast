import express from 'express';
import fetch from 'node-fetch';
import { Request, Response } from 'express';
import { roastService } from '../services/roast.service';

const router = express.Router();

// Simple proxy endpoint for imgflip images
router.get('/proxy/imgflip/*', async (req: Request, res: Response) => {
  try {
    const imagePath = req.params[0];
    const imageUrl = `https://i.imgflip.com/${imagePath}`;
    
    // Validate the image URL
    if (!imageUrl.startsWith('https://i.imgflip.com/')) {
      return res.status(400).json({ error: 'Invalid image source' });
    }

    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    // Forward the content type and handle null case
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.set('Content-Type', contentType);
    
    // Pipe the image data directly to the response
    response.body.pipe(res);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

// Test endpoint that fetches the latest roast image
router.get('/test-proxy', async (_, res: Response) => {
  try {
    // Get the latest roast data
    const latestRoast = await roastService.getLatestRoast();
    const testImageUrl = latestRoast?.meme_url || 'https://i.imgflip.com/default.jpg';

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proxy Test</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <h1>Proxy Test</h1>
          <p>Testing image proxy with: ${testImageUrl}</p>
          <img src="/api/proxy/imgflip/${testImageUrl.split('imgflip.com/')[1]}" alt="Test meme" />
          <script>
            // Auto-refresh the page every few seconds to show latest meme
            setTimeout(() => window.location.reload(), 5000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).json({ error: 'Failed to render test page' });
  }
});

export default router; 