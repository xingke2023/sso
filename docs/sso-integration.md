# SSO 统一认证接入方案

## 概述

认证中心地址：`https://mo.xingke888.com`

基于 JWT（HMAC-SHA256）实现统一身份认证，支持：
- 用户名 / 密码登录
- 微信扫码登录（开放平台）

各应用共享同一个 `JWT_SECRET`，本地验证 Token，**无需每次请求回调认证中心**。

---

## 登录方式一：用户名 / 密码

### 流程

```
用户输入用户名 + 密码
  → POST /api/auth/login
  → 返回 accessToken + refreshToken
  → 应用本地验证 JWT，取出 userId
  → 查映射表 → 登录或自动创建本地用户
```

### 注册

```http
POST https://mo.xingke888.com/api/auth/register
Content-Type: application/json

{
  "username": "alice",       // 必填，3-50位，字母/数字/下划线
  "password": "12345678",    // 必填，最少8位
  "name": "Alice",           // 可选
  "email": "a@example.com"   // 可选
}
```

### 登录

```http
POST https://mo.xingke888.com/api/auth/login
Content-Type: application/json

{
  "identifier": "alice",     // 用户名或邮箱
  "password": "12345678"
}
```

响应：

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "abc...",
    "user": {
      "id": 1,
      "username": "alice",
      "email": null,
      "name": "Alice",
      "avatar": null
    }
  }
}
```

---

## 登录方式二：微信扫码登录

### 流程

```
用户点击「微信登录」按钮
  → 跳转 SSO 微信授权地址（带 redirect_uri）
  → 微信展示二维码，用户扫码授权
  → 认证中心换取微信用户信息，生成 JWT
  → 302 跳回 redirect_uri?accessToken=...&refreshToken=...
  → 应用回调页存储 Token，跳转业务页面
```

### 第一步：发起登录

前端按钮：

```html
<button onclick="loginWithWechat()">微信登录</button>

<script>
function loginWithWechat() {
  // 记录当前页，登录后跳回
  sessionStorage.setItem('returnTo', window.location.pathname);

  const redirectUri = encodeURIComponent('https://your-app.com/oauth/callback');
  window.location.href =
    'https://mo.xingke888.com/api/oauth/wechat?redirect_uri=' + redirectUri;
}
</script>
```

> `redirect_uri` 的域名必须提前告知管理员加入白名单，否则回调会跳到认证中心默认地址。

### 第二步：回调页处理

在 `https://your-app.com/oauth/callback` 页面（或路由）中：

```javascript
// Vue / React / 原生 JS 均适用
function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const accessToken  = params.get('accessToken');
  const refreshToken = params.get('refreshToken');

  if (!accessToken) {
    // 授权失败
    window.location.href = '/login?error=oauth_failed';
    return;
  }

  // 存储 Token
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);

  // 清理 URL，避免 Token 留在浏览器历史记录
  window.history.replaceState({}, '', window.location.pathname);

  // 跳回原页面
  const returnTo = sessionStorage.getItem('returnTo') || '/';
  sessionStorage.removeItem('returnTo');
  window.location.href = returnTo;
}

handleOAuthCallback();
```

---

## Token 管理

| 项目 | 说明 |
|------|------|
| accessToken 有效期 | 15 分钟 |
| refreshToken 有效期 | 7 天，用一次即失效（轮换机制） |
| 验证方式 | 本地验证（共享 JWT_SECRET） |
| 算法 | HMAC-SHA256 |

### 请求接口时携带 Token

```http
Authorization: Bearer <accessToken>
```

### 刷新 accessToken

accessToken 过期（接口返回 401）时，用 refreshToken 换新的：

```http
POST https://mo.xingke888.com/api/token/refresh
Content-Type: application/json

{
  "refreshToken": "abc..."
}
```

响应：

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "xyz..."   // 新的 refreshToken，旧的立即失效
  }
}
```

### 登出

```http
POST https://mo.xingke888.com/api/token/logout
Content-Type: application/json

{
  "refreshToken": "abc..."
}
```

### 验证 Token（服务端调用）

```http
GET https://mo.xingke888.com/api/token/verify
Authorization: Bearer <accessToken>
```

响应：

```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": { "userId": 1, "email": null, "name": "Alice", "avatar": null }
  }
}
```

---

## 前端封装建议

统一请求函数，自动处理 Token 刷新：

```javascript
async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: 'Bearer ' + localStorage.getItem('accessToken'),
    },
  });

  if (res.status === 401) {
    const ok = await doRefreshToken();
    if (ok) return request(url, options); // 重试一次
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    return;
  }

  return res.json();
}

async function doRefreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  const res = await fetch('https://mo.xingke888.com/api/token/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return false;

  const { data } = await res.json();
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  return true;
}
```

---

## 后端接入（本地验证 JWT）

### 需要做的事

1. 联系管理员获取 `JWT_SECRET`
2. 建映射表，关联 SSO 用户与本地业务用户
3. 中间件验证 Token，自动映射或创建本地用户

### 映射表

```sql
CREATE TABLE sso_users (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  sso_user_id   INT UNIQUE NOT NULL,
  local_user_id INT NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Laravel 示例

```php
// composer require firebase/php-jwt

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// 中间件
$token   = str_replace('Bearer ', '', $request->header('Authorization'));
$payload = JWT::decode($token, new Key(env('SSO_JWT_SECRET'), 'HS256'));

$ssoUserId = $payload->userId;

// 查映射，不存在则自动创建
$mapping = DB::table('sso_users')->where('sso_user_id', $ssoUserId)->first();
if ($mapping) {
    $user = User::find($mapping->local_user_id);
} else {
    $user = User::create([
        'name'   => $payload->name,
        'avatar' => $payload->avatar,
    ]);
    DB::table('sso_users')->insert([
        'sso_user_id'   => $ssoUserId,
        'local_user_id' => $user->id,
    ]);
}
Auth::login($user);
```

### Node.js 示例

```javascript
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, process.env.SSO_JWT_SECRET);
    req.ssoUser = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalid or expired' });
  }
}
```

---

## 接口汇总

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 注册（用户名必填，邮箱可选） |
| `/api/auth/login` | POST | 密码登录 |
| `/api/oauth/wechat` | GET | 发起微信扫码登录 |
| `/api/oauth/wechat/callback` | GET | 微信回调（认证中心内部处理） |
| `/api/token/refresh` | POST | 刷新 accessToken |
| `/api/token/logout` | POST | 登出（吊销 refreshToken） |
| `/api/token/verify` | GET | 验证 accessToken 有效性 |

---

## 职责划分

| 职责 | 认证中心 | 各应用 |
|------|---------|--------|
| 验证用户身份 | ✅ | |
| 颁发 / 刷新 Token | ✅ | |
| 微信 OAuth 对接 | ✅ | |
| 维护业务用户数据 | | ✅ |
| 映射 SSO ID → 本地 ID | | ✅ |
| 权限 / 角色管理 | | ✅ |

---

## 接入检查清单

- [ ] 获取 `JWT_SECRET`，配置到应用环境变量
- [ ] 将 `redirect_uri` 域名告知管理员加入白名单（`CORS_ORIGINS`）
- [ ] 创建 `sso_users` 映射表
- [ ] 实现回调页 `/oauth/callback`，存储 Token 并跳转
- [ ] 实现 Token 自动刷新逻辑（401 时触发）
- [ ] 后端中间件验证 JWT，自动映射本地用户
