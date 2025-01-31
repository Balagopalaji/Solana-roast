import { Router } from 'express';
import { AppError } from '../types';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

router.get('/error', () => {
  throw new AppError(500, 'error', 'Test error endpoint');
});

export default router; 