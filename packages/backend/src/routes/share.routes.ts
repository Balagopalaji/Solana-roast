import express from 'express';
import { shareService } from '../services/share.service';
import { validateShareRequest } from '../middleware/validation.middleware';
import logger from '../utils/logger';

const router = express.Router();

// Create share
router.post('/create', validateShareRequest, async (req, res, next) => {
  try {
    const shareUrl = await shareService.createShareableLink(req.body);
    res.json({ success: true, shareUrl });
  } catch (error) {
    next(error);
  }
});

// Get share with metadata
router.get('/:shareId', async (req, res, next) => {
  try {
    const roastData = await shareService.getShareDetails(req.params.shareId);
    if (!roastData) {
      return res.status(404).send('Roast not found or expired');
    }

    // For social media sharing
    if (req.headers.accept?.includes('text/html')) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>SolanaRoast - Wallet Roast</title>
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:site" content="@SolanaRoast">
            <meta name="twitter:title" content="SolanaRoast.lol">
            <meta name="twitter:description" content="${roastData.roast}">
            <meta name="twitter:image" content="${roastData.memeUrl}">
            <meta property="og:image" content="${roastData.memeUrl}">
            <meta property="og:title" content="SolanaRoast.lol">
            <meta property="og:description" content="${roastData.roast}">
            <meta property="og:url" content="${process.env.FRONTEND_URL}/share/${req.params.shareId}">
        </head>
        <body>
            <script>
                window.location.href = '/roast?wallet=${roastData.walletAddress}';
            </script>
        </body>
        </html>
      `);
    }

    // For API requests
    res.json(roastData);
  } catch (error) {
    next(error);
  }
});

export default router; 