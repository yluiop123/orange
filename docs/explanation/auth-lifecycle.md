# 登录与会话生命周期

本页解释 access token、refresh cookie、令牌吊销表与登录失败计数如何协同，以及强制改密为什么放在过滤器里；要改认证、会话或密码流程的开发者读这一页。

## 1. 令牌与存储

以 Spring Boot 参考实现为例，登录成功后后端签发两个 JWT，都用 RS256 签名，issuer 默认为 `orange`。access token 默认 900 秒，refresh token 默认 604800 秒；两者都可用环境变量覆盖。JWT 里带 `jti`、`typ`（`access` 或 `refresh`）、`ver`（用户的 `token_version`）、`username`、`sub`（用户 ID）、签发时间与过期时间。

| 凭证 | 存放位置 | 前端可读 | 默认有效期 | 用途 |
| --- | --- | --- | --- | --- |
| access token | 内存（`authToken`） | 是，但只在内存 | 900 秒 | 每个业务请求的 `Authorization: Bearer` |
| refresh token | HttpOnly Cookie `refresh_token` | 否 | 604800 秒 | 换取新令牌；登出时读取并吊销 |

refresh cookie 的 `Path` 是 `/api/v1/auth`，`HttpOnly`，`SameSite` 默认 `Lax`，`Secure` 默认关闭、生产必须打开，`Domain` 可选；因此浏览器会把它带到整个 `/api/v1/auth` 前缀，但真正消费它的只有 `refresh` 与 `logout`。前端只在内存里保存 access token，不写 `localStorage`；`localStorage` 里的 `orange.session` 只是一个“可能已登录”的非敏感标记，用来决定刷新页面时要不要尝试 refresh。这样 XSS 拿不到 refresh token，代价是每次刷新都要多一次 refresh 往返。

## 2. 登录

`POST /api/v1/auth/login` 的顺序是：先按 IP 与用户名检查锁定，未锁定才走认证；认证失败时同时记录 IP 与用户两个维度的失败，并统一返回 40101 与“用户名或密码错误”，不区分用户不存在与密码错误，避免用户名枚举。认证成功只清除用户维度的计数，不清 IP 维度——否则攻击者可以用一次成功登录重置 IP 限流。

随后后端重新加载用户、签发 access 与 refresh、把 refresh 写入 Set-Cookie，并返回 `{token, status, field, msg, expiresIn, refreshExpiresIn}`。登录响应**不包含** `mustChangePassword`：这个状态在紧接着的 `/auth/user-info` 里返回；即使前端没来得及读，后续请求也会被 40302 闸门拦住。

## 3. 每个请求如何认证

`JwtRequestFilter` 对每个请求最多解析一次 access token，然后重新加载用户并同时校验五件事：令牌类型是 access、用户仍启用、`ver` 等于当前 `token_version`、令牌未过期、`username` 与 `sub` 仍对应当前用户。任一不满足就不建立认证上下文，交给入口点返回 40101。重新加载用户而不是信任令牌里的权限，意味着禁用用户、改密码、登出可以立刻生效，代价是每请求一次用户查询。

强制改密也在这里判断：若用户 `must_change_password` 为真，除 `change-password`、`user-info`、`menus`、`logout` 四个白名单路径外，过滤器直接写 40302 并终止请求。把闸门放在过滤器而不是每个 controller，是为了不可能“忘记加注解”；代价是白名单成为一段必须随新增自助接口一起维护的常量。

## 4. 刷新

`POST /api/v1/auth/refresh` 只读 cookie，不读请求体。顺序是：没有 cookie → 40101“未登录”；解析失败或类型不是 refresh → 40101“登录已过期”；`jti` 已在 `sys_revoked_token` 中 → 40101；用户不存在、被禁用、`ver` 不匹配或 `sub` 不匹配 → 40101；随后**先吊销旧 refresh 的 jti，再签发新的一对令牌**并覆盖 cookie。吊销用“插入主键，冲突即失败”的语义：PostgreSQL/SQLite 用 `ON CONFLICT (jti) DO NOTHING`，MySQL/MariaDB 用 `INSERT IGNORE`；插入影响行数为 0 说明这个 jti 已被用过，按重放处理，返回 401。

轮换让被窃取的旧 cookie 只有一次使用窗口；两个并发刷新也只有一个能成功，另一个会看到插入冲突。每次成功刷新都会写一行吊销记录，写入前顺手删除 `expires_at` 已过期的记录，所以表不会无限增长。

## 5. 登出

`POST /api/v1/auth/logout` 是公开端点，因为 access token 可能已经过期。它先尝试解析 refresh cookie：能解析就吊销该 `jti`，解析失败则忽略；拿不到用户名时回退到当前 access token 的主体；只要拿到用户名就递增 `token_version`，使该用户所有 access 与 refresh 全部失效；最后清空 cookie。前端在发请求前先清本地状态，登出请求失败也不影响本地登出。

递增 `token_version` 的语义是“登出所有设备”，不是“只登出当前设备”。这是有意的取舍：实现简单、状态集中、无法被旧令牌绕过；代价是用户在某一台设备登出会连带其他设备。若将来需要单设备登出，必须额外维护 access `jti` 或会话表，而不是改这一行。

## 6. 强制改密

两种场景会把 `must_change_password` 置为真：新建用户时生成 12 位临时密码；管理员重置密码时同样生成临时密码并置位。重置还会递增 `token_version`，所以旧会话立即失效，并清空该用户的登录失败计数。

`POST /api/v1/auth/change-password` 要求旧密码正确、新密码不等于旧密码，然后更新密码、把标志置回假、递增 `token_version`、清空失败计数、清空 refresh cookie。响应提示“密码已修改，请重新登录”，前端收到后清会话并跳登录页；也就是说改密成功不延长当前会话，而是强制重新认证。

前端对 40302 有两条并行处理：布局组件根据 `userInfo.mustChangePassword` 打开不可关闭的改密对话框；axios 拦截器在任意非认证请求收到 40302 时，把强制改密状态置为真。两条路径都存在，是因为缓存的 `user-info` 可能落后于后端状态。

## 7. 令牌失效的三条路径

| 机制 | 作用范围 | 何时写入 | 何时检查 |
| --- | --- | --- | --- |
| `sys_revoked_token`（按 `jti`） | 单个令牌（refresh；部分栈也含 access） | 刷新轮换、登出、部分栈的 access 登出 | 刷新时；部分栈每个请求 |
| `sys_user.token_version` | 该用户全部令牌 | 登出、改密、重置密码、禁用用户 | 每个请求解析令牌后 |
| `sys_user.status` | 该用户全部会话 | 管理员禁用用户 | 登录、刷新、每请求加载用户时 |

三者不是替代关系：`jti` 表解决“单个 refresh 被轮换后不能重放”，`token_version` 解决“一次动作让所有会话失效”，`status` 解决“账号本身不可用”。Spring Boot 的登出不单独吊销 access 的 `jti`，而是靠递增版本让它在下一个请求失效；C# 与 FastAPI 还会额外把 access `jti` 写进吊销表。两者从客户端观察到的结果相同，属于允许的实现差异。

## 8. 登录锁定

失败计数落在 `sys_login_attempt`，主键是 `attempt_key`，形如 `ip:<地址>` 或 `user:<小写用户名>`。默认策略：单账号 5 次、单 IP 20 次触发锁定，统计窗口与锁定时长都是 15 分钟，均可配置。每次失败同时递增两个维度；成功登录只删除用户维度；被锁定时登录接口直接返回 HTTP 429 与“登录失败次数过多，请稍后再试”，不再校验密码。

实现上做了两处并发处理：更新已有记录时用 `PESSIMISTIC_WRITE` 行锁；首次插入撞主键时改为读取并递增，避免并发登录把请求打成 500。计数放在数据库而不是进程内，是为了多实例部署共享同一份状态。

这套策略有两个需要知道的副作用。第一，失败计数按用户名小写归并，而用户名唯一性区分大小写，因此 `Admin` 与 `admin` 会共享同一个 `user:admin` 锁定键。第二，失败记录不要求用户真实存在，攻击者可以用 5 次错误尝试把某个已知用户名锁定 15 分钟；这是“阻止在线猜密码”与“允许恶意锁定”之间的取舍，当前选择前者。另外 Spring Boot 的登录限流取的是 `request.getRemoteAddr()`，不读 `X-Forwarded-For`；部署在反向代理后时，所有请求会共享代理地址的 IP 计数。

## 9. 取舍总结

短 access + 长 refresh + 轮换，把“令牌泄露的窗口”压到一次刷新；refresh 放 HttpOnly Cookie，避免 JS 读取，CSRF 风险靠 `SameSite`、受限 `Path` 与 CORS 白名单收敛，没有额外的 CSRF token。JWT 保持无状态，但每个请求仍要查用户以支持即时吊销；真正有状态的只有 refresh 的 `jti` 黑名单与登录失败计数。强制改密放在过滤器，保证不可能绕过；代价是白名单常量与每请求的用户加载。没有会话表，所以“查看当前登录设备/单设备下线”不在当前模型内。

> Last verified: 24826bb · 2026-11-07
> 事实来源: backend/springboot/src/main/resources/application.yaml、backend/springboot/src/main/java/com/orange/controller/login/LoginController.java、backend/springboot/src/main/java/com/orange/security/jwt/JwtUtil.java、backend/springboot/src/main/java/com/orange/security/jwt/JwtRequestFilter.java、backend/springboot/src/main/java/com/orange/security/auth/LoginAttemptService.java、backend/springboot/src/main/java/com/orange/security/auth/TokenBlacklistService.java、backend/springboot/src/main/java/com/orange/security/auth/RefreshTokenCookie.java、backend/springboot/src/main/java/com/orange/service/system/impl/UserServiceImpl.java、backend/springboot/src/main/java/com/orange/domain/common/ErrorCode.java、frontend/react/src/auth/token.ts、frontend/react/src/auth/service.ts、frontend/react/src/lib/axios.ts、frontend/react/src/store/user.ts、frontend/react/src/components/change-password-dialog.tsx
