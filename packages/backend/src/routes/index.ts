import { Router } from 'express';
import roastRoutes from './roast.routes';
import clipboardRoutes from './clipboard.routes';

// ... other imports

const router = Router();

router.use('/roast', roastRoutes);
router.use('/clipboard', clipboardRoutes);

export default router; 