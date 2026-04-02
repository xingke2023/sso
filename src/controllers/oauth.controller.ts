import { Request, Response, NextFunction } from 'express';
import { oauthService } from '../services/oauth.service';
import { tokenService } from '../services/token.service';
import { Profile as GoogleProfile } from 'passport-google-oauth20';

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);

function resolveRedirectBase(state?: string): string {
  const fallback = process.env.OAUTH_SUCCESS_REDIRECT || 'http://localhost:3000/oauth/callback';
  if (!state || state === 'default') return fallback;

  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf8');
    const url = new URL(decoded);
    const origin = url.origin;
    if (ALLOWED_ORIGINS.includes(origin)) return decoded;
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
    const googleProfile = req.user as unknown as GoogleProfile;
    const user = await oauthService.findOrCreateGoogleUser(googleProfile);
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
    const wechatProfile = req.user as unknown as {
      openid: string;
      unionid?: string;
      nickname?: string;
      headimgurl?: string;
    };
    const user = await oauthService.findOrCreateWechatUser(wechatProfile);
    const tokens = await tokenService.issueTokenPair(user);
    res.redirect(buildSuccessRedirect(tokens, req.query.state as string));
  } catch (err) {
    next(err);
  }
}
