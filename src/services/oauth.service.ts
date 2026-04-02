import { Profile as GoogleProfile } from 'passport-google-oauth20';
import { userService } from './user.service';
import { User, OAuthProfile } from '../types';

export const oauthService = {
  async findOrCreateGoogleUser(profile: GoogleProfile): Promise<User> {
    const oauthProfile: OAuthProfile = {
      providerId: profile.id,
      name: profile.displayName || profile.id,
      email: profile.emails?.[0]?.value,
      avatar: profile.photos?.[0]?.value,
    };
    return userService.findOrCreateOAuthUser('google', oauthProfile);
  },

  async findOrCreateWechatUser(profile: {
    openid: string;
    unionid?: string;
    nickname?: string;
    headimgurl?: string;
  }): Promise<User> {
    const oauthProfile: OAuthProfile = {
      // 优先用 unionid（跨应用唯一），没有则降级用 openid
      providerId: profile.unionid || profile.openid,
      name: profile.nickname || profile.openid,
      avatar: profile.headimgurl,
    };
    return userService.findOrCreateOAuthUser('wechat', oauthProfile);
  },
};
