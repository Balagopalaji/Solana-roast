import { Router } from 'express';
import { openAIService } from '../services/openai.service';
import { solanaService } from '../services/solana.service';
import { AppError } from '../types';
import rateLimit from 'express-rate-limit';

const router = Router();

// Stricter rate limit for roast generation
const roastLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // increased from 10 to 50 for testing
  message: 'Too many roasts requested. Please try again later.',
});

router.post('/', roastLimiter, async (req, res, next) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      throw new AppError(400, 'error', 'Wallet address is required');
    }

    if (!solanaService.isValidWalletAddress(walletAddress)) {
      throw new AppError(400, 'error', 'Invalid Solana wallet address');
    }

    const walletData = await solanaService.getWalletData(walletAddress);
    const roast = await openAIService.generateRoast(walletData);

    res.status(200).json({
      status: 'success',
      data: {
        ...roast,
        wallet: walletData
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/test', async (req, res, next) => {
  try {
    const roast = await openAIService.testRoastGeneration();
    res.status(200).json({
      status: 'success',
      data: roast,
    });
  } catch (error) {
    next(error);
  }
});

export default router; 