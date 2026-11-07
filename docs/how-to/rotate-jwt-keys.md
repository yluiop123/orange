# 生成与轮换 JWT 密钥

本页说明六套后端各自的签名算法、密钥读取位置、生成命令，以及轮换后旧 token 为什么立即失效；要换密钥、排查“登录后立刻 401”或准备上线的人读这一页。

## 1. 算法与密钥来源

| 栈 | 算法 | 密钥来源 | 配置文件 |
| --- | --- | --- | --- |
| Spring Boot | RS256（RSA 2048） | PEM 密钥对 | `application.yaml` 的 `jwt.private-key` / `jwt.public-key` |
| Go | 默认 HS256；配置了 RSA 时 RS256 | `JWT_SECRET`，或 PEM | `.env.local` |
| NestJS | HS256 | `JWT_SECRET` | `.env.local` |
| .NET | HS256 | `JWT_SECRET` | `.env.local` |
| Rust | HS256 | `JWT_SECRET` | `.env` |
| FastAPI | HS256 | `JWT_SECRET` | `.env` |

六栈的 token 内容一致：`jti`、`typ`（access/refresh）、`ver`（用户的 `token_version`）、`username`、`sub`、issuer、签发与过期时间。算法不同不影响前端，前端只持有 access token 与 HttpOnly refresh Cookie。

## 2. 生成 Spring 的密钥对

```bash
node scripts/generate-jwt-keys.mjs
node scripts/generate-jwt-keys.mjs --force
```

脚本用 Node 的 `generateKeyPairSync` 生成 2048 位 RSA，写入：

- `backend/springboot/src/main/resources/keys/private_key.pem`（PKCS#8，权限 600）
- `backend/springboot/src/main/resources/keys/public_key.pem`（SPKI，权限 644）

两个文件都存在时脚本直接退出，只有 `--force` 才覆盖。它们已被 `.gitignore` 忽略，不要提交；生产环境把密钥挂到容器或密钥管理系统，用 `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` 指向实际位置（Spring Resource 写法，如 `file:/etc/orange/private_key.pem`）。

Spring 的加载规则（`JwtKeyConfig`）：

- 默认从 `classpath:keys/private_key.pem` 与 `classpath:keys/public_key.pem` 读。
- 非生产环境缺少文件时生成临时密钥对并打警告；重启后旧 token 全部失效。
- `APP_ENV=production`/`prod` 或 `prod` profile 下缺少文件直接启动失败，不会静默用临时密钥。
- 只接受 PKCS#8 私钥与 SPKI 公钥；换其他格式要先转换。

## 3. 生成 HS256 的密钥

五个 HS256 栈只认一个高熵字符串。用标准库生成，不要手写：

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

把它写进该栈的环境变量（本地文件或部署平台的 secret），真实环境变量优先于 `.env*` 文件。开发默认值是 `orange-dev-secret-change-me-in-production`；当 `APP_ENV` 为 `production`/`prod` 时，Go、NestJS（还看 `NODE_ENV`）、.NET、Rust、FastAPI 都会因为仍是默认值而拒绝启动。

Go 还支持非对称：同时提供 `JWT_PRIVATE_KEY_PATH` 与 `JWT_PUBLIC_KEY_PATH`（或内联 PEM 的 `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`）时切到 RS256，此时 `JWT_SECRET` 被忽略；只给其中一半不会生效。

## 4. 轮换步骤

1. **生成新值**：Spring 用 `--force` 重新生成密钥对；HS256 栈生成新的随机字符串。
2. **一次只轮换一套栈**：九套实现之间没有共享会话，Spring 的密钥不会影响 FastAPI 的 token。
3. **分发到该栈的所有实例**：多实例必须使用同一份密钥；只改一台会让 token 在负载均衡后随机 401。
4. **滚动重启**：新进程用新密钥签发；旧进程未重启前仍用旧密钥，期间新旧 token 并存，重启完成即切换。
5. **确认旧 token 失效**：旧 access token 验签失败返回 401；旧 refresh Cookie 刷新同样失败，用户需要重新登录。
6. **保留旧密钥只用于回滚**：确认无异常后再销毁。回滚旧密钥会让尚未过期的旧 token 重新有效；要彻底作废，需递增 `token_version` 或等它们过期。

## 5. 旧 token 为什么会失效

轮换密钥后，旧 token 的签名无法用新密钥验证，这是第一道也是最主要的一道闸门。仓库里还有两条按需失效路径（细节见 [登录与会话](../explanation/auth-lifecycle.md)）：

| 机制 | 作用范围 | 何时写入 |
| --- | --- | --- |
| `sys_revoked_token`（按 `jti`） | 单个 refresh（部分栈也含 access） | 刷新轮换、登出 |
| `sys_user.token_version` | 该用户全部 token | 登出、改密、重置密码、禁用用户 |

`sys_revoked_token` 的列是 `jti`（主键）、`token_type`、`expires_at`、`create_time`，`expires_at` 上有索引。Spring 与 FastAPI 在写入新吊销记录前会删除已过期的行，所以表不会无限增长；轮换密钥本身不需要清空这张表。

## 6. 验证

用新账号登录，确认拿到 token：

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:<后端端口>/api/v1/auth/login -ContentType 'application/json' -Body '{"username":"super","password":"super"}'
```

再用轮换前的旧 token 调 `GET /api/v1/auth/user-info`，预期 HTTP 401（而不是 200）。旧 refresh Cookie 调 `POST /api/v1/auth/refresh` 也应返回 401。最后用 `scripts/ci/http-smoke.mjs` 对目标后端跑一遍完整冒烟。

## 7. 注意事项

- 密钥与 secret 永远不进 Git；CI 里没有生产密钥，生产密钥由部署环境注入。
- `JWT_SECRET` 要有足够熵（至少 32 字节随机值），不要复用数据库密码或示例值。
- 生产必须开 `COOKIE_SECURE=true`，跨站部署再配 `COOKIE_SAME_SITE=None` 与 `COOKIE_DOMAIN`；否则 refresh Cookie 在 HTTPS 下行为不符合预期。
- Spring 的公私钥必须成对；只替换其中一个会让新签发的 token 与公钥不匹配、验签失败。
- 轮换是运维动作，不需要改 `contracts/openapi.json`，也不需要改前端。

> Last verified: 24826bb · 2026-11-07
> 事实来源: `scripts/generate-jwt-keys.mjs`、`.gitignore`、`backend/springboot/src/main/resources/application.yaml`、`backend/springboot/src/main/java/com/orange/security/jwt/{JwtKeyConfig.java,JwtUtil.java}`、`backend/go-gin-gorm/{.env.example,cmd/server/main.go,internal/config/config.go,internal/auth/token.go}`、`backend/node-nestjs/{.env.example,src/config/app-config.ts}`、`backend/csharp/{.env.example,src/Orange.Api/Configuration/AppOptions.cs}`、`backend/rust-axum/{.env.example,src/config.rs}`、`backend/python-fastapi/{.env.example,app/config.py,app/security/tokens.py}`、`database/postgres/ddl.sql`
