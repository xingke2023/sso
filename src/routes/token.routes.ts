import { Router } from 'express';
import { refresh, logout, verify } from '../controllers/token.controller';

const router = Router();

router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/verify', verify);

export default router;
