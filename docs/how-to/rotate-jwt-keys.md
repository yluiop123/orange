# 轮换 JWT 密钥

本页解决：生成、轮换、验证 JWT 签名密钥，以及轮换后哪些会话会失效。
读者：部署或运维这套系统的开发者。

## 1. 各后端用什么密钥

| 后端 | 算法 | 密钥来源 |
| --- | --- | --- |
| Spring Boot | RS256 | `backend/springboot/src/main/resources/keys/private_key.pem` / `public_key.pem`，可用 `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` 覆盖（默认 `classpath:keys/...`） |
| Go | HS256（默认）或 RS256 | `JWT_SECRET`；设置 `JWT_PRIVATE_KEY_PATH` + `JWT_PUBLIC_KEY_PATH` 后切 RS256 |
| NestJS | HS256 | `JWT_SECRET` |
| .NET | HS256 | `JWT_SECRET` |
| Rust | HS256 | `JWT_SECRET` |
| FastAPI | HS256 | `JWT_SECRET` |

共用参数（各栈 `.env.example` 与 Spring `application.yaml` 一致）：`JWT_ISSUER=orange`、`JWT_ACCESS_EXPIRE=900`（15 分钟）、`JWT_REFRESH_EXPIRE=604800`（7 天）。

**只有 Spring 与 Go 支持非对称密钥**；其余四栈只有共享 secret。跨栈联调时，要么让所有后端都用同一个 `JWT_SECRET`，要么接受“令牌不能跨后端通用”。

## 2. 生成密钥

### Spring（RS256）

```bash
node scripts/generate-jwt-keys.mjs
```

脚本把密钥写到 `backend/springboot/src/main/resources/keys/`：

- 已存在 `private_key.pem` 与 `public_key.pem` 时**不会覆盖**，直接退出并提示
- 需要重新生成时加 `--force`，此时**所有已签发的 token 立即失效**

`*.pem` 已被 `.gitignore` 排除（`backend/springboot/src/main/resources/keys/*.pem`），不要提交。

### 其余后端（HS256）

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

把输出写进对应后端的本地环境文件（`.env.local` / `.env`，均被 gitignore），或部署平台的 secret 配置。`.env.example` 里的 `orange-dev-secret-change-me-in-production` 只用于本地开发。

## 3. 轮换步骤

1. **生成新密钥**（Spring 用脚本 + `--force`；其余用上面的命令生成新 secret）。
2. **更新配置**：Spring 覆盖 `keys/*.pem` 或改 `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`；Go 改 `JWT_SECRET`（或换 RS256 的两个路径变量）；其余四栈改 `JWT_SECRET`。
3. **重启后端**：密钥在启动时加载，热改配置不会生效。
4. **验证**：用旧 token 调 `/api/v1/auth/user-info` 应返回 401；重新登录后拿到的新 token 正常。可跑 `node scripts/ci/http-smoke.mjs <baseUrl>` 做一轮完整冒烟（登录、user-info、菜单、用户列表、组织增删、操作日志、登出）。
5. **清理**：旧密钥文件/旧 secret 从部署配置中删除，避免回滚时误用。

## 4. 失效范围

| 对象 | 轮换后 |
| --- | --- |
| 已签发的 access token | 全部失效（签名不再匹配），用户需重新登录 |
| 已签发的 refresh token | 全部失效，`/api/v1/auth/refresh` 返回 401 |
| 服务端会话/黑名单 | 无需清理：`sys_revoked_token` 只记录主动吊销，与签名密钥无关 |
| 其他后端 | 如果它们共用同一 secret，同样全部失效；如果各自独立，只影响被改的那一个 |

## 5. 常见问题

- **改了 `.env` 没生效**：确认后端读取的是哪个文件（Spring 用 `application-local.yaml`，其余用 `.env`/`.env.local`），并确认进程已重启。
- **Spring 启动报找不到密钥**：`classpath:keys/` 下缺少 pem，先跑生成脚本。
- **跨栈登录后另一个后端 401**：各后端 secret 不一致，或 Spring 用 RS256 而其他栈用 HS256；统一算法与密钥后再试。
- **想强制所有用户下线**：轮换密钥是最彻底的方式；只登出单个会话用 `/api/v1/auth/logout`（会写 `sys_revoked_token`）。

> Last verified: 24826bb · 2026-11-07
> 事实来源: scripts/generate-jwt-keys.mjs、backend/*/.env.example、backend/springboot/src/main/resources/application.yaml、.gitignore
