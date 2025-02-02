import express from 'express';
import { urlService } from '../services/url.service';

const router = express.Router();

router.get('/shorten-url', async (req, res) => {
  const longUrl = req.query.url as string;
  if (!longUrl) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const shortUrl = await urlService.shortenUrl(longUrl);
    res.send(shortUrl);
  } catch (error) {
    res.status(500).json({ error: 'Failed to shorten URL' });
  }
});

export default router; 