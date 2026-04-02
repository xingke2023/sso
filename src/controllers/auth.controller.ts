import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service';
import { tokenService } from '../services/token.service';
import { validate } from '../middleware/validate.middleware';

const registerSchema = z.object({
  email: z.string().email('请输入有效邮箱'),
  password: z.string().min(8, '密码至少8位').max(100),
  name: z.string().min(1, '请输入姓名').max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerValidator = validate(registerSchema);
export const loginValidator = validate(loginSchema);

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, name } = req.body;
    const user = await userService.register(email, password, name);
    const tokens = await tokenService.issueTokenPair(user);

    res.status(201).json({
      success: true,
      data: {
        ...tokens,
        user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const user = await userService.login(email, password);
    const tokens = await tokenService.issueTokenPair(user);

    res.json({
      success: true,
      data: {
        ...tokens,
        user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
      },
    });
  } catch (err) {
    next(err);
  }
}
