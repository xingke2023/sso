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
      providerId: profile.unionid || profile.openid,
      name: profile.nickname || profile.openid,
      avatar: profile.headimgurl,
    };
    return userService.findOrCreateOAuthUser('wechat', oauthProfile);
  },

  async findOrCreateWechatMiniappUser(openid: string, unionid?: string): Promise<User> {
    const oauthProfile: OAuthProfile = {
      providerId: unionid || openid,
      name: `wx_${openid.slice(-6)}`,
    };
    return userService.findOrCreateOAuthUser('wechat_miniapp', oauthProfile);
  },
};
