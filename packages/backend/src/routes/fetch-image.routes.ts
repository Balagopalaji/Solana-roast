import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    console.log("Fetching image from URL:", url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    console.log("Content-Type:", contentType);

    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error("The URL does not point to a valid image");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    console.log("Image successfully fetched and converted to base64");

    return res.json({
      data: `data:${contentType};base64,${base64}`
    });

  } catch (error) {
    console.error('Error in API route:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch image' 
    });
  }
});

export default router; 