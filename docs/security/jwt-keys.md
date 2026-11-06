# JWT 密钥

## 开发/演示

后端在 `jwt.private-key` / `jwt.public-key` 找不到文件时会生成一对**临时 RSA 密钥**，并打印 warning。临时密钥只适合本地开发和 CI：服务重启后旧 token 会失效。

如果想固定本地密钥，运行：

```bash
node scripts/generate-jwt-keys.mjs
```

文件会写到 `backend/springboot/src/main/resources/keys/`，并已被 `.gitignore` 忽略。

## 生产

不要把私钥提交到仓库。生产环境应通过 Secret 或挂载文件提供：

```text
JWT_PRIVATE_KEY=file:/run/secrets/jwt_private_key.pem
JWT_PUBLIC_KEY=file:/run/secrets/jwt_public_key.pem
```

轮换密钥会使所有已签发 token 失效，需要配合 `tokenVersion` 或重新登录策略。

## 相关配置

- `backend/springboot/src/main/java/com/orange/security/config/JwtProperties.java`
- `backend/springboot/src/main/java/com/orange/security/jwt/JwtKeyConfig.java`
- 各后端目录下的 `.env.example` / `application-local.example.yaml`（JWT 变量示例）
