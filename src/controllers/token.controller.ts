import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services/token.service';
import { verifyAccessToken } from '../config/jwt';
import { AppError } from '../middleware/error.middleware';

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('MISSING_REFRESH_TOKEN', 400, '缺少 refreshToken');

    const tokens = await tokenService.rotateRefreshToken(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('MISSING_REFRESH_TOKEN', 400, '缺少 refreshToken');

    await tokenService.revokeRefreshToken(refreshToken);
    res.json({ success: true, data: { message: '已登出' } });
  } catch (err) {
    next(err);
  }
}

export function verify(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('UNAUTHORIZED', 401, '缺少 Authorization header');
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    res.json({ success: true, data: { valid: true, user: payload } });
  } catch {
    next(new AppError('INVALID_TOKEN', 401, 'Token 无效或已过期'));
  }
}
