import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services/token.service';
import { User } from '../types';

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);

function resolveRedirectBase(state?: string): string {
  const fallback = process.env.OAUTH_SUCCESS_REDIRECT || 'http://localhost:3000/oauth/callback';
  if (!state || state === 'default') return fallback;

  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf8');
    const url = new URL(decoded);
    if (ALLOWED_ORIGINS.includes(url.origin)) return decoded;
  } catch {
    // 解码失败，用默认值
  }
  return fallback;
}

function buildSuccessRedirect(
  tokens: { accessToken: string; refreshToken: string },
  state?: string
): string {
  const base = resolveRedirectBase(state);
  const url = new URL(base);
  url.searchParams.set('accessToken', tokens.accessToken);
  url.searchParams.set('refreshToken', tokens.refreshToken);
  return url.toString();
}

export async function handleGoogleCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as unknown as User;
    const tokens = await tokenService.issueTokenPair(user);
    res.redirect(buildSuccessRedirect(tokens, req.query.state as string));
  } catch (err) {
    next(err);
  }
}

export async function handleWechatCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as unknown as User;
    const tokens = await tokenService.issueTokenPair(user);
    res.redirect(buildSuccessRedirect(tokens, req.query.state as string));
  } catch (err) {
    next(err);
  }
}

