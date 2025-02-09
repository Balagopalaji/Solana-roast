import { Router } from 'express';
import roastRoutes from './roast.routes';
import proxyRoutes from './proxy.routes';

// ... other imports

const router = Router();

router.use('/roast', roastRoutes);
router.use('/api/proxy', proxyRoutes);

export default router; 