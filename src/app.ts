import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import passport from './config/passport';
import router from './routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
const wildcardPatterns = allowedOrigins
  .filter((o) => o.startsWith('*.'))
  .map((o) => new RegExp('^https?://[^.]+\\.' + o.slice(2).replace(/\./g, '\\.') + '$'));
const exactOrigins = new Set(allowedOrigins.filter((o) => !o.startsWith('*.')));

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (exactOrigins.has(origin)) return cb(null, true);
      if (wildcardPatterns.some((re) => re.test(origin))) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(passport.initialize());
app.use('/api', router);

// 接入文档页面
app.get('/docs', (_req, res) => {
  const mdPath = path.join(__dirname, '../../docs/sso-integration.md');
  const md = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf8') : '# 文档不存在';
  const html = marked(md) as string;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SSO 认证中心接入文档</title>
  <style>
    body { max-width: 860px; margin: 40px auto; padding: 0 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #24292e; line-height: 1.6; }
    h1, h2, h3 { border-bottom: 1px solid #eaecef; padding-bottom: 8px; margin-top: 24px; }
    code { background: #f6f8fa; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; font-family: monospace; }
    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #dfe2e5; padding: 8px 12px; }
    th { background: #f6f8fa; }
    a { color: #0366d6; }
    blockquote { border-left: 4px solid #dfe2e5; margin: 0; padding: 0 16px; color: #6a737d; }
    hr { border: none; border-top: 1px solid #eaecef; margin: 24px 0; }
  </style>
</head>
<body>${html}</body>
</html>`);
});

// OAuth 回调落地页（网页授权成功后重定向至此，token 写入 localStorage）
app.get('/oauth/callback', (req, res) => {
  const { accessToken, refreshToken, error } = req.query as Record<string, string>;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>登录中...</title>
  <style>
    body { display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;
           font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f5f5; }
    .card { background: #fff; border-radius: 12px; padding: 40px 48px; text-align: center; box-shadow: 0 2px 16px rgba(0,0,0,.08); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h2 { margin: 0 0 8px; font-size: 20px; color: #111; }
    p  { margin: 0; color: #666; font-size: 14px; }
  </style>
</head>
<body>
<div class="card" id="box">
  <div class="icon">⏳</div>
  <h2>登录处理中</h2>
  <p>请稍候...</p>
</div>
<script>
  (function () {
    var accessToken  = ${JSON.stringify(accessToken  || '')};
    var refreshToken = ${JSON.stringify(refreshToken || '')};
    var error        = ${JSON.stringify(error        || '')};
    var box = document.getElementById('box');

    if (error) {
      box.innerHTML = '<div class="icon">❌</div><h2>登录失败</h2><p>' + error + '</p>';
      return;
    }

    if (accessToken) {
      try { localStorage.setItem('sso_access_token',  accessToken);  } catch(_) {}
      try { localStorage.setItem('sso_refresh_token', refreshToken); } catch(_) {}
    }

    // 优先通知父窗口（弹窗模式）
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        { type: 'SSO_LOGIN_SUCCESS', accessToken: accessToken, refreshToken: refreshToken },
        '*'
      );
      window.close();
      return;
    }

    // 普通跳转模式：带 token 跳转到前端
    box.innerHTML = '<div class="icon">✅</div><h2>登录成功</h2><p>正在跳转...</p>';
    var dest = new URL('https://demo1.xingke888.com/image');
    if (accessToken)  dest.searchParams.set('accessToken',  accessToken);
    if (refreshToken) dest.searchParams.set('refreshToken', refreshToken);
    setTimeout(function () { window.location.href = dest.toString(); }, 800);
  })();
</script>
</body>
</html>`);
});

// 微信域名校验
app.get('/ub10b8eAJx.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('a986bf035c42edc98f14fb0cb58fb9b8');
});

app.use(errorHandler);

export default app;
