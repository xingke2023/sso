import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service';
import { tokenService } from '../services/token.service';
import { validate } from '../middleware/validate.middleware';

const registerSchema = z.object({
  email: z.string().email('请输入有效邮箱').optional(),
  username: z.string().min(3, '用户名至少3位').max(50).regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  password: z.string().min(8, '密码至少8位').max(100),
  name: z.string().max(100).optional(),
});

const loginSchema = z.object({
  identifier: z.string().min(1, '请输入邮箱或用户名'),
  password: z.string().min(1),
});

export const registerValidator = validate(registerSchema);
export const loginValidator = validate(loginSchema);

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, username, password, name } = req.body;
    const user = await userService.register(username, password, name, email);
    const tokens = await tokenService.issueTokenPair(user);

    res.status(201).json({
      success: true,
      data: {
        ...tokens,
        user: { id: user.id, email: user.email, username: user.username, name: user.name, avatar: user.avatar },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { identifier, password } = req.body;
    const user = await userService.login(identifier, password);
    const tokens = await tokenService.issueTokenPair(user);

    res.json({
      success: true,
      data: {
        ...tokens,
        user: { id: user.id, email: user.email, username: user.username, name: user.name, avatar: user.avatar },
      },
    });
  } catch (err) {
    next(err);
  }
}
