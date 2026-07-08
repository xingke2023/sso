# SSO 认证中心

Express + TypeScript 单点登录服务，端口 **8111**，生产域名 `mo.xingke888.com`。

## 常用命令

```bash
npm run dev          # 开发（ts-node-dev 热重载）
npm run build        # 编译 TypeScript → dist/
npm start            # 运行编译产物
npm run db:migrate   # 执行数据库迁移
```

## 项目结构

```
src/
  app.ts                  # Express 实例、CORS、静态路由
  server.ts               # HTTP 监听入口
  config/                 # passport、jwt、database 配置
  controllers/            # 请求处理（auth、oauth、token、wechat-miniapp）
  middleware/             # auth、error、validate
  models/                 # user、oauth-account、refresh-token
  routes/                 # /api/auth  /api/oauth  /api/token  /api/health
  services/               # oauth、token、user 业务逻辑
  types/                  # 全局类型扩展
database/migrations/      # 001~005 SQL 迁移文件
```

## API 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 账号密码登录 |
| GET  | /api/auth/me | 获取当前用户（Bearer token） |
| PATCH| /api/auth/me | 更新当前用户 |
| GET  | /api/oauth/google | Google OAuth 跳转 |
| GET  | /api/oauth/wechat | 微信开放平台扫码登录 |
| GET  | /api/oauth/wechat-mp | 微信公众号网页授权 |
| POST | /api/oauth/wechat-miniapp | 微信小程序 code 换 JWT |
| POST | /api/token/refresh | 刷新 access token |
| POST | /api/token/logout | 注销 |
| POST | /api/token/verify | 验证 token（子站调用） |
| GET  | /docs | 接入文档（Markdown 渲染） |
| GET  | /oauth/callback | OAuth 落地页（写 localStorage / postMessage） |

## 关键配置（.env）

| 变量 | 说明 |
|------|------|
| `JWT_SECRET` | JWT 签名密钥，**子站验证 token 时使用** |
| `CORS_ORIGINS` | 逗号分隔，支持 `*.xingke888.com` 通配符（匹配单级子域名） |
| `OAUTH_SUCCESS_REDIRECT` | OAuth 成功后前端落地页 |
| `WECHAT_APP_ID/SECRET` | 微信开放平台（PC扫码） |
| `WECHAT_MP_APP_ID/SECRET` | 微信公众号 |
| `WECHAT_MINIAPP_APP_ID/SECRET` | 微信小程序 |

## 子站接入要点

- 验证 token：`POST /api/token/verify`，Body `{ "token": "<accessToken>" }`
- 或本地验证：`jsonwebtoken.verify(token, JWT_SECRET)` 使用同一个 `JWT_SECRET`
- access token 有效期短，过期用 refresh token 调 `/api/token/refresh` 换新
- CORS 已开放 `*.xingke888.com`，子站前端直接跨域请求即可

## CORS 通配符说明

`CORS_ORIGINS` 中以 `*.` 开头的条目会生成正则 `^https?://[^.]+\.domain\.com$`，
仅匹配**单级**子域名（如 `us01.xingke888.com`），不匹配多级子域名。
