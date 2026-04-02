import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { oauthService } from '../services/oauth.service';

// Google OAuth2 Strategy（仅在配置了 clientID 时启用）
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8111/api/oauth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await oauthService.findOrCreateGoogleUser(profile);
          done(null, user as unknown as Express.User);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );
}

// 微信 Strategy（使用 passport-wechat，仅在配置了 appID 时启用）
// eslint-disable-next-line @typescript-eslint/no-require-imports
const WechatStrategy = require('passport-wechat');

if (process.env.WECHAT_APP_ID) {
  passport.use(
    new WechatStrategy(
      {
        appID: process.env.WECHAT_APP_ID,
        appSecret: process.env.WECHAT_APP_SECRET || '',
        callbackURL: process.env.WECHAT_CALLBACK_URL || 'http://localhost:8111/api/oauth/wechat/callback',
        client: 'web',
        scope: 'snsapi_login',
        state: 'wechat_login',
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: { openid: string; nickname?: string; headimgurl?: string },
        done: (err: Error | null, user?: Express.User) => void
      ) => {
        try {
          const user = await oauthService.findOrCreateWechatUser(profile);
          done(null, user as unknown as Express.User);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );
}

export default passport;
