# JWT 密钥

## 算法与密钥来源

| 栈 | 默认算法 | 密钥来源 |
| --- | --- | --- |
| Spring Boot | RS256 | `jwt.private-key` / `jwt.public-key`（PEM 文件） |
| Go | HS256（可选 RS256） | `JWT_SECRET`；配置 `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH` 后切换 RS256 |
| NestJS / FastAPI / Rust / C# | HS256 | `JWT_SECRET` |

六套后端共享同一个 JWT 契约：`iss=orange`、access 900 秒、refresh 604800 秒，
claims 为 `jti/typ/ver/username/sub/iss/iat/exp`。算法不同是刻意保留的，
token 不要求跨栈互认；同一套栈内签发与校验一致即可。

## 开发 / 演示

Spring Boot 在 `jwt.private-key` / `jwt.public-key` 找不到文件时会生成一对
**临时 RSA 密钥**，并打印 warning。临时密钥只适合本地开发和 CI：服务重启后
旧 token 会失效。

如果想固定本地密钥，运行：

```bash
node scripts/generate-jwt-keys.mjs
```

文件会写到 `backend/springboot/src/main/resources/keys/`，并已被 `.gitignore`
忽略。**这些文件不再提交到 git**；新克隆的仓库需要先运行上面的脚本，或让
Spring Boot 生成临时密钥。

HS256 各栈不需要文件，直接使用 `.env.example` 中的 `JWT_SECRET`。本地默认值
统一为 `orange-dev-secret-change-me-in-production`。

## 生产

不要把私钥提交到仓库。生产环境应通过 Secret 或挂载文件提供：

```text
JWT_PRIVATE_KEY=file:/run/secrets/jwt_private_key.pem
JWT_PUBLIC_KEY=file:/run/secrets/jwt_public_key.pem
```

`APP_ENV=production`（或 Spring 的 `prod` profile）下：

- Spring Boot 缺少 RSA 密钥文件会直接启动失败。
- HS256 各栈在 `JWT_SECRET` 缺失或仍为开发默认值时会直接启动失败。

轮换密钥或 `JWT_SECRET` 会使所有已签发 token 失效，需要配合 `tokenVersion`
或重新登录策略。

## 相关配置

- `backend/springboot/src/main/java/com/orange/security/config/JwtProperties.java`
- `backend/springboot/src/main/java/com/orange/security/jwt/JwtKeyConfig.java`
- 各后端目录下的 `.env.example` / `application-local.example.yaml`（JWT 变量示例）
- `scripts/check-config.mjs`（校验各栈模板的 JWT 契约）
