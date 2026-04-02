import bcrypt from 'bcrypt';
import { userModel } from '../models/user.model';
import { User, OAuthProfile } from '../types';
import { oauthAccountModel } from '../models/oauth-account.model';
import { AppError } from '../middleware/error.middleware';

export const userService = {
  async register(email: string, password: string, name: string): Promise<User> {
    const existing = await userModel.findByEmail(email);
    if (existing) throw new AppError('EMAIL_TAKEN', 409, '该邮箱已被注册');

    const password_hash = await bcrypt.hash(password, 12);
    return userModel.create({ email, password_hash, name });
  },

  async login(email: string, password: string): Promise<User> {
    const user = await userModel.findByEmail(email);
    if (!user || !user.password_hash) {
      throw new AppError('INVALID_CREDENTIALS', 401, '邮箱或密码错误');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError('INVALID_CREDENTIALS', 401, '邮箱或密码错误');

    return user;
  },

  async findOrCreateOAuthUser(
    provider: 'google' | 'wechat',
    profile: OAuthProfile
  ): Promise<User> {
    const oauthAccount = await oauthAccountModel.findByProvider(provider, profile.providerId);
    if (oauthAccount) {
      return (await userModel.findById(oauthAccount.user_id))!;
    }

    // 同邮箱合并账号
    let user = profile.email ? await userModel.findByEmail(profile.email) : null;
    if (!user) {
      user = await userModel.create({
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
      });
    }

    await oauthAccountModel.create({ userId: user.id, provider, providerId: profile.providerId });
    return user;
  },
};
