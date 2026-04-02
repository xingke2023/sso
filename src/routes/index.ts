import { Router } from 'express';
import authRoutes from './auth.routes';
import oauthRoutes from './oauth.routes';
import tokenRoutes from './token.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/oauth', oauthRoutes);
router.use('/token', tokenRoutes);
router.use('/health', healthRoutes);

export default router;
