import 'dotenv/config';
import app from './app';
import { pool } from './config/database';
import { refreshTokenModel } from './models/refresh-token.model';

const PORT = Number(process.env.PORT) || 4000;

async function start() {
  // 验证数据库连通性
  const conn = await pool.getConnection();
  conn.release();
  console.log('✓ Database connected');

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Auth center running on http://0.0.0.0:${PORT}`);
  });

  // 每天清理过期 Token
  setInterval(
    async () => {
      await refreshTokenModel.cleanExpired().catch(console.error);
    },
    24 * 60 * 60 * 1000
  );
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
