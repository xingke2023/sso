import crypto from 'crypto';
import { userModel } from '../models/user.model';
import { refreshTokenModel } from '../models/refresh-token.model';
import { signAccessToken, JWT_REFRESH_DAYS } from '../config/jwt';
import { User, TokenPair, JwtPayload } from '../types';
import { AppError } from '../middleware/error.middleware';

function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function toPayload(user: User): JwtPayload {
  return { userId: user.id, username: user.username, email: user.email, name: user.name, avatar: user.avatar };
}

export const tokenService = {
  async issueTokenPair(user: User): Promise<TokenPair> {
    const accessToken = signAccessToken(toPayload(user));
    const rawRefresh = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256(rawRefresh);
    const expiresAt = new Date(Date.now() + JWT_REFRESH_DAYS * 86400_000);

    await refreshTokenModel.insert({ userId: user.id, tokenHash, expiresAt });

    return { accessToken, refreshToken: rawRefresh };
  },

  async rotateRefreshToken(rawToken: string): Promise<TokenPair> {
    const hash = sha256(rawToken);
    const record = await refreshTokenModel.findByHash(hash);

    if (!record || record.revoked || new Date(record.expires_at) < new Date()) {
      throw new AppError('INVALID_REFRESH_TOKEN', 401, '无效或已过期的 Refresh Token');
    }

    await refreshTokenModel.revoke(record.id);
    const user = await userModel.findById(record.user_id);
    if (!user) throw new AppError('USER_NOT_FOUND', 401, '用户不存在');

    return this.issueTokenPair(user);
  },

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const hash = sha256(rawToken);
    await refreshTokenModel.revokeByHash(hash);
  },
};
