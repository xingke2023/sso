import { Router, Request, Response, NextFunction } from 'express';
import passport from '../config/passport';
import { handleGoogleCallback, handleWechatCallback } from '../controllers/oauth.controller';

const router = Router();

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/oauth/failure' }),
  handleGoogleCallback
);

// 微信开放平台 OAuth（PC 扫码登录）
router.get('/wechat', (req: Request, res: Response, next: NextFunction) => {
  const redirectUri = req.query.redirect_uri as string | undefined;
  const state = redirectUri
    ? Buffer.from(redirectUri).toString('base64url')
    : 'default';
  passport.authenticate('wechat', { session: false, state })(req, res, next);
});
router.get(
  '/wechat/callback',
  passport.authenticate('wechat', { session: false, failureRedirect: '/api/oauth/failure' }),
  handleWechatCallback
);

// 微信公众号网页授权（微信内置浏览器自动登录）
router.get('/wechat-mp', (req: Request, res: Response, next: NextFunction) => {
  const redirectUri = req.query.redirect_uri as string | undefined;
  const state = redirectUri
    ? Buffer.from(redirectUri).toString('base64url')
    : 'default';
  passport.authenticate('wechat-mp', { session: false, state })(req, res, next);
});
router.get(
  '/wechat-mp/callback',
  passport.authenticate('wechat-mp', { session: false, failureRedirect: '/api/oauth/failure' }),
  handleWechatCallback
);

// OAuth 失败回调
router.get('/failure', (_req, res) => {
  res.status(401).json({ success: false, error: { code: 'OAUTH_FAILED', message: 'OAuth 登录失败' } });
});

export default router;
