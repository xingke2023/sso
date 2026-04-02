import { Request, Response, NextFunction } from 'express';
import { oauthService } from '../services/oauth.service';
import { tokenService } from '../services/token.service';
import { Profile as GoogleProfile } from 'passport-google-oauth20';
import { User } from '../types';

function buildSuccessRedirect(tokens: { accessToken: string; refreshToken: string }): string {
  const base = process.env.OAUTH_SUCCESS_REDIRECT || 'http://localhost:3000/oauth/callback';
  const params = new URLSearchParams({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
  return `${base}?${params.toString()}`;
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
    res.redirect(buildSuccessRedirect(tokens));
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
      nickname?: string;
      headimgurl?: string;
    };
    const user = await oauthService.findOrCreateWechatUser(wechatProfile);
    const tokens = await tokenService.issueTokenPair(user);
    res.redirect(buildSuccessRedirect(tokens));
  } catch (err) {
    next(err);
  }
}
