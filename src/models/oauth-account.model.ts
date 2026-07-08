import { pool } from '../config/database';
import { OAuthAccount } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const oauthAccountModel = {
  async findByProvider(provider: 'google' | 'wechat' | 'wechat_miniapp', providerId: string): Promise<OAuthAccount | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM oauth_accounts WHERE provider = ? AND provider_id = ?',
      [provider, providerId]
    );
    return (rows[0] as OAuthAccount) ?? null;
  },

  async create(data: { userId: number; provider: 'google' | 'wechat' | 'wechat_miniapp'; providerId: string }): Promise<void> {
    await pool.query<ResultSetHeader>(
      'INSERT INTO oauth_accounts (user_id, provider, provider_id) VALUES (?, ?, ?)',
      [data.userId, data.provider, data.providerId]
    );
  },
};
