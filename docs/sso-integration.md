# SSO 统一认证中心接入文档

## 概述

认证中心地址：`https://mo.xingke888.com`

基于 JWT（HMAC-SHA256）实现统一身份认证，支持：
- 用户名 / 密码登录
- 微信扫码登录（开放平台）

各应用共享同一个 `JWT_SECRET`，本地验证 Token，**无需每次请求都回调认证中心**。

---

## 接入前准备

联系管理员获取以下信息：

| 项目 | 说明 |
|------|------|
| `JWT_SECRET` | 用于本地验证 accessToken 的密钥 |
| 域名白名单授权 | 告知你的应用域名，加入 CORS 和 redirect_uri 白名单 |

---

## 接口一览

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 注册账号 |
| `/api/auth/login` | POST | 用户名/密码登录 |
| `/api/oauth/wechat` | GET | 发起微信扫码登录 |
| `/api/oauth/wechat/callback` | GET | 微信授权回调（认证中心内部处理，无需调用） |
| `/api/token/refresh` | POST | 刷新 accessToken |
| `/api/token/logout` | POST | 登出，吊销 refreshToken |
| `/api/token/verify` | GET | 验证 accessToken 有效性 |

---

## 注册

```
POST /api/auth/register
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | ✅ | 用户名，3~50位，只能包含字母、数字、下划线 |
| `password` | string | ✅ | 密码，最少8位，最多100位 |
| `name` | string | ❌ | 昵称/姓名，最多100位，不填默认为空 |
| `email` | string | ❌ | 邮箱，需符合邮箱格式 |

### 请求示例

```json
{
  "username": "alice",
  "password": "12345678",
  "name": "Alice",
  "email": "alice@example.com"
}
```

### 响应参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `success` | boolean | 是否成功 |
| `data.accessToken` | string | 访问令牌，有效期 15 分钟 |
| `data.refreshToken` | string | 刷新令牌，有效期 7 天，用一次即失效 |
| `data.user.id` | number | SSO 用户 ID |
| `data.user.username` | string\|null | 用户名 |
| `data.user.email` | string\|null | 邮箱 |
| `data.user.name` | string | 昵称 |
| `data.user.avatar` | string\|null | 头像 URL |

### 响应示例

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a1b2c3d4e5f6...",
    "user": {
      "id": 1,
      "username": "alice",
      "email": "alice@example.com",
      "name": "Alice",
      "avatar": null
    }
  }
}
```

### 错误码

| code | HTTP | 说明 |
|------|------|------|
| `EMAIL_TAKEN` | 409 | 该邮箱已被注册 |
| `USERNAME_TAKEN` | 409 | 该用户名已被占用 |
| `VALIDATION_ERROR` | 400 | 参数格式不正确 |

---

## 用户名/密码登录

```
POST /api/auth/login
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `identifier` | string | ✅ | 用户名或邮箱（含 `@` 视为邮箱，否则视为用户名） |
| `password` | string | ✅ | 密码 |

### 请求示例

```json
{
  "identifier": "alice",
  "password": "12345678"
}
```

### 响应参数

同注册接口响应，返回 `accessToken`、`refreshToken`、`user` 对象。

### 错误码

| code | HTTP | 说明 |
|------|------|------|
| `INVALID_CREDENTIALS` | 401 | 账号或密码错误 |
| `VALIDATION_ERROR` | 400 | 参数缺失或格式错误 |

---

## 微信扫码登录

### 流程说明

```
1. 前端跳转 /api/oauth/wechat?redirect_uri=https://your-app.com/oauth/callback
2. 认证中心重定向到微信扫码页面
3. 用户用微信扫码授权
4. 认证中心处理回调，生成 Token
5. 302 跳回 redirect_uri，携带 accessToken 和 refreshToken
```

### 发起登录

```
GET /api/oauth/wechat
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `redirect_uri` | string | ❌ | 授权成功后跳转的地址，需提前加入白名单；不填则跳转认证中心默认地址 |

### 发起示例

```html
<a href="https://mo.xingke888.com/api/oauth/wechat?redirect_uri=https://your-app.com/oauth/callback">
  微信登录
</a>
```

### 回调参数

微信授权成功后，认证中心会 302 跳转到 `redirect_uri`，并在 URL 上附加：

| 参数 | 类型 | 说明 |
|------|------|------|
| `accessToken` | string | 访问令牌，有效期 15 分钟 |
| `refreshToken` | string | 刷新令牌，有效期 7 天，用一次即失效 |

### 回调示例

```
https://your-app.com/oauth/callback?accessToken=eyJ...&refreshToken=abc...
```

### 前端回调页处理

```javascript
const params = new URLSearchParams(window.location.search);
const accessToken  = params.get('accessToken');
const refreshToken = params.get('refreshToken');

if (!accessToken) {
  window.location.href = '/login?error=oauth_failed';
  return;
}

localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// 清理 URL，避免 Token 留在浏览器历史记录
window.history.replaceState({}, '', window.location.pathname);

const returnTo = sessionStorage.getItem('returnTo') || '/';
sessionStorage.removeItem('returnTo');
window.location.href = returnTo;
```

> **注意：** `redirect_uri` 的域名必须提前告知管理员加入白名单，否则会跳转到认证中心默认地址。

---

## 刷新 accessToken

accessToken 有效期 15 分钟，过期后用 refreshToken 换取新的。

```
POST /api/token/refresh
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `refreshToken` | string | ✅ | 登录或上次刷新时获得的 refreshToken |

### 请求示例

```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

### 响应参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `data.accessToken` | string | 新的访问令牌 |
| `data.refreshToken` | string | 新的刷新令牌（旧的立即失效） |

### 错误码

| code | HTTP | 说明 |
|------|------|------|
| `INVALID_REFRESH_TOKEN` | 401 | Token 无效、已使用或已过期 |

---

## 登出

```
POST /api/token/logout
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `refreshToken` | string | ✅ | 需要吊销的 refreshToken |

### 请求示例

```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

### 响应示例

```json
{
  "success": true,
  "data": { "message": "已登出" }
}
```

---

## 验证 accessToken

用于服务端验证 Token 有效性并获取用户信息。

```
GET /api/token/verify
Authorization: Bearer <accessToken>
```

### 请求头

| 参数 | 必填 | 说明 |
|------|------|------|
| `Authorization` | ✅ | 格式：`Bearer <accessToken>` |

### 响应参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `data.valid` | boolean | Token 是否有效 |
| `data.user.userId` | number | SSO 用户 ID |
| `data.user.username` | string\|null | 用户名 |
| `data.user.email` | string\|null | 邮箱 |
| `data.user.name` | string | 昵称 |
| `data.user.avatar` | string\|null | 头像 URL |

### 响应示例

```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "userId": 1,
      "username": "alice",
      "email": "alice@example.com",
      "name": "Alice",
      "avatar": null
    }
  }
}
```

### 错误码

| code | HTTP | 说明 |
|------|------|------|
| `INVALID_TOKEN` | 401 | Token 无效或已过期 |
| `UNAUTHORIZED` | 401 | 缺少 Authorization 请求头 |

---

## JWT Payload 说明

accessToken 解码后的 payload 包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `userId` | number | SSO 用户唯一 ID，用于映射本地用户 |
| `username` | string\|null | 用户名，微信登录用户为 null |
| `email` | string\|null | 邮箱，未填写或微信登录用户可能为 null |
| `name` | string | 昵称，微信登录用户为微信昵称 |
| `avatar` | string\|null | 头像 URL，微信登录用户为微信头像 |
| `iat` | number | 签发时间（Unix 时间戳） |
| `exp` | number | 过期时间（Unix 时间戳） |

> 用 `JWT_SECRET` 和 HMAC-SHA256 算法本地验证，**无需请求认证中心**。

---

## 后端接入示例

### 本地用户映射表

各应用需建立 SSO 用户与本地用户的映射关系：

```sql
CREATE TABLE sso_users (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  sso_user_id   INT UNIQUE NOT NULL COMMENT 'SSO 用户 ID（JWT 中的 userId）',
  local_user_id INT NOT NULL COMMENT '本地业务用户 ID',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Laravel 示例

```php
// composer require firebase/php-jwt

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// 中间件：验证 Token，自动映射本地用户
$token   = str_replace('Bearer ', '', $request->header('Authorization'));
$payload = JWT::decode($token, new Key(env('SSO_JWT_SECRET'), 'HS256'));

$ssoUserId = $payload->userId;

$mapping = DB::table('sso_users')->where('sso_user_id', $ssoUserId)->first();
if ($mapping) {
    $user = User::find($mapping->local_user_id);
} else {
    // 首次登录，自动创建本地用户
    $user = User::create([
        'username' => $payload->username,
        'name'     => $payload->name,
        'email'    => $payload->email,
        'avatar'   => $payload->avatar,
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
    req.ssoUser = jwt.verify(token, process.env.SSO_JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalid or expired' });
  }
}
```

---

## 前端 Token 自动刷新

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

## 统一错误格式

所有接口错误均返回以下格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

---

## 职责划分

| 职责 | 认证中心 | 各应用 |
|------|---------|--------|
| 验证用户身份（密码/微信） | ✅ | |
| 颁发 / 刷新 / 吊销 Token | ✅ | |
| 微信 OAuth 对接 | ✅ | |
| 本地验证 JWT | | ✅ |
| 维护业务用户数据 | | ✅ |
| 映射 SSO ID → 本地 ID | | ✅ |
| 权限 / 角色管理 | | ✅ |

---

## 接入检查清单

- [ ] 向管理员申请 `JWT_SECRET`
- [ ] 向管理员申请将应用域名加入白名单
- [ ] 创建本地 `sso_users` 映射表
- [ ] 后端实现 JWT 验证中间件，自动映射/创建本地用户
- [ ] 前端实现微信登录跳转（保存 `returnTo`）
- [ ] 前端实现 `/oauth/callback` 回调页（存 Token、跳转）
- [ ] 前端实现 Token 自动刷新（401 时触发）
- [ ] 前端登出时调用 `/api/token/logout` 吊销 refreshToken
