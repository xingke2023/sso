import { pool } from '../config/database';
import { RefreshToken } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const refreshTokenModel = {
  async insert(data: { userId: number; tokenHash: string; expiresAt: Date }): Promise<void> {
    await pool.query<ResultSetHeader>(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [data.userId, data.tokenHash, data.expiresAt]
    );
  },

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM refresh_tokens WHERE token_hash = ?',
      [tokenHash]
    );
    return (rows[0] as RefreshToken) ?? null;
  },

  async revoke(id: number): Promise<void> {
    await pool.query('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?', [id]);
  },

  async revokeByHash(tokenHash: string): Promise<void> {
    await pool.query('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [tokenHash]);
  },

  async cleanExpired(): Promise<void> {
    await pool.query('DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = 1');
  },
};
