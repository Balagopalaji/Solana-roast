import { Router } from 'express';
import { AppError } from '../types';
import rateLimit from 'express-rate-limit';
import { RoastService } from '../services/roast.service';
import { SolanaService } from '../services/solana.service';
import logger from '../utils/logger';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { environment } from '../config/environment';

const router = Router();

// Create service instances
const solanaServiceInstance = new SolanaService();
const roastService = new RoastService(solanaServiceInstance);

// Rate limit for roast generation
const roastLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: 'Too many roasts requested. Please try again later.',
});

// Main roast generation endpoint
router.post('/', roastLimiter, async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    logger.info(`Received roast request for wallet: ${walletAddress}`);

    if (!walletAddress) {
      logger.warn('Missing wallet address in request');
      throw new AppError(400, 'error', 'Wallet address is required');
    }

    if (!solanaServiceInstance.isValidWalletAddress(walletAddress)) {
      logger.warn(`Invalid wallet address received: ${walletAddress}`);
      throw new AppError(400, 'error', 'Invalid Solana wallet address');
    }

    logger.info(`Generating roast for wallet: ${walletAddress}`);
    const roastData = await roastService.generateRoast(walletAddress);
    
    logger.info('Roast generated successfully');
    res.status(200).json({
      status: 'success',
      data: roastData
    });
  } catch (error) {
    logger.error('Error in roast generation:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    next(error);
  }
});

// Test endpoint for development
router.get('/test', async (req, res, next) => {
  try {
    // Use roastService instead of openAIService
    const testWalletAddress = 'DRtqaYHyXFPVD5hzKHk3f9JF5GwEjAHgtqzxVHnM8u9Y';
    const roastData = await roastService.generateRoast(testWalletAddress);
    
    res.status(200).json({
      status: 'success',
      data: roastData
    });
  } catch (error) {
    next(error);
  }
});

// Add this route to test Solana connection
router.get('/test-connection', async (req, res, next) => {
  try {
    const testWallet = '6SdbvU6b7nMYf4sbsgghQ8sxsSS7pmqN8qUaDhi5N9RN';
    const connection = new Connection(environment.solana.rpcUrl);
    
    const balance = await connection.getBalance(new PublicKey(testWallet));
    logger.info('Test connection successful:', { balance });
    
    res.json({
      status: 'success',
      data: {
        balance: balance / LAMPORTS_PER_SOL
      }
    });
  } catch (error) {
    logger.error('Test connection failed:', error);
    next(error);
  }
});

export default router; 