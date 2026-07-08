import { Request, Response, NextFunction } from 'express';
import https from 'https';
import { oauthService } from '../services/oauth.service';
import { tokenService } from '../services/token.service';
import { AppError } from '../middleware/error.middleware';

const APPID = process.env.WECHAT_MINIAPP_APP_ID!;
const SECRET = process.env.WECHAT_MINIAPP_APP_SECRET!;

interface Jscode2SessionResult {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

function jscode2session(code: string): Promise<Jscode2SessionResult> {
  return new Promise((resolve, reject) => {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { reject(new Error('微信响应解析失败')); }
      });
    }).on('error', reject);
  });
}

export async function loginWithMiniapp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = req.body as { code?: string };
    if (!code) throw new AppError('MISSING_CODE', 400, '缺少 code 参数');

    const result = await jscode2session(code);
    if (result.errcode || !result.openid) {
      throw new AppError('WECHAT_AUTH_FAILED', 401, result.errmsg || '微信登录失败');
    }

    const user = await oauthService.findOrCreateWechatMiniappUser(result.openid, result.unionid);
    const tokens = await tokenService.issueTokenPair(user);

    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
}
