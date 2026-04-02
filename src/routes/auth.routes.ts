import { Router } from 'express';
import { register, login, registerValidator, loginValidator } from '../controllers/auth.controller';

const router = Router();

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);

export default router;
