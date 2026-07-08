import { Router } from 'express';
import { register, login, getMe, updateMe, registerValidator, loginValidator, updateMeValidator } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/me', authMiddleware, getMe);
router.patch('/me', authMiddleware, updateMeValidator, updateMe);

export default router;
