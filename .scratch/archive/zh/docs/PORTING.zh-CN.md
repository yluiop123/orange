> [English](./PORTING.md) | 简体中文

# 移植检查清单

本文档定义了"在另一个技术栈中实现同一个产品"意味着什么。请结合以下文档一起阅读：

- [FEATURES.md](./FEATURES.md) —— 产品范围与页面清单。
- [API.md](./API.md) —— 端点、认证、错误、分页。
- [DATABASE.md](./DATABASE.md) —— 模式（schema）、不变量、方言。
- [`contracts/openapi.json`](../contracts/openapi.json) —— 机器可读的 API。

参考实现是 `backend/springboot` 和 `frontend/react`。当本文档未作说明时，以它们的行为为准。

## 1. 仓库规则

- 后端位于 `backend/<stack>/`；前端位于 `frontend/<stack>/`。
- 每个技术栈目录都有自己的 README，涵盖：前置条件、安装、运行、测试、构建、环境变量和已知缺口。
- 新增技术栈时，不要修改 `contracts/`、`database/`、`docs/`、根目录的 README，或其他技术栈的目录。维护者变更共享契约时，应在同一次提交中更新这些路径，并在提交信息中明确指出契约变更。
- 不要提交密钥、`node_modules`、`target`、`bin`、`obj`、`.venv`、`dist`，或者该技术栈自身锁文件之外的生成锁文件噪音。
- 技术栈可运行后，将其添加到 `docs/STACKS.md`。

## 2. 后端交付物

新的后端必须实现 [API.md](./API.md) 中的规范端点。已废弃的旧路由不作要求。

### 2.1 必需行为

| 领域 | 要求 |
| --- | --- |
| 响应封装 | `{ code, message, data, timestamp, traceId }`，错误响应也是如此 |
| 错误 | 与 [API.md](./API.md) 相同的业务码和 HTTP 状态码 |
| Trace ID | 接受或生成 `X-Trace-Id`，并在响应体和响应头中返回 |
| 认证 | 访问令牌 + HttpOnly 轮换刷新 Cookie；登出会吊销访问令牌的 `jti` |
| 令牌失效 | 内嵌 `token_version`；递增它会使所有会话失效 |
| 强制修改密码 | `must_change_password` 会以 `40302` 阻断除 `user-info`、`menus`、`change-password`、`logout` 之外的所有端点 |
| 登录锁定 | 每用户 5 次失败、每 IP 20 次失败，15 分钟统计窗口与锁定时长，持久化在 `sys_login_attempt` |
| 密码 | BCrypt；创建/重置时使用 12 个字符的临时密码 |
| RBAC | 权限标识 `type#path` 与 `type#path:action`；已启用角色的权限 + 直接权限 − 已禁用项 的并集 |
| 菜单 | `/auth/menus` 仅返回已启用的 `menu`/`directory` 节点，按 code 排序，不包含 `action` 节点 |
| 树规则 | code 形态、不可变性、父节点存在、禁用保护、由深到浅删除、引用保护 |
| 唯一性 | 权限 `(type, path, action)`，其中 `NULL` 的 action 视为一个取值 |
| 操作日志 | 对 `/api/v1/system/*` 和 `/auth/change-password` 的非 GET 写操作；脱敏并截断；绝不记录敏感请求体 |
| 校验 | 是否要拒绝非必填字段上的空查询过滤条件？不 —— 接受空字符串；拒绝非法的写操作 |
| CORS | 允许已配置的前端源携带凭证访问 |

### 2.2 建议的结构

使用该语言惯用的布局。保持与 Java 后端相同的接缝（seam）：

- 配置与安全
- 领域策略（code 形态、权限形态、有效权限）
- 仓储
- 服务
- HTTP 处理器
- 中间件（追踪、认证、操作日志、错误映射）

### 2.3 验证

至少包括：

1. 项目构建无错误。
2. 单元测试覆盖 code 策略、权限形态、有效权限和登录锁定。
3. 冒烟测试针对 PostgreSQL 启动应用并检查：
   - 未认证请求 → 返回 401 并带响应封装；
   - 登录 → 令牌 + 刷新 Cookie；
   - `user-info` 和 `menus`；
   - 每个资源一个列表端点；
   - 一次被拒绝的未授权调用 → 403。
4. README 说明哪些内容尚未实现。

## 3. 前端交付物

新的前端必须实现 [FEATURES.md §5](./FEATURES.md#5-page-inventory) 中的每个页面。

### 3.1 必需行为

| 领域 | 要求 |
| --- | --- |
| 认证 | 登录、401 时刷新、登出、强制修改密码 |
| 会话 | 访问令牌仅保存在内存中；绝不放入 `localStorage`；通过 Cookie 刷新 |
| 菜单 | 渲染后端返回的树；容器节点可展开；面包屑来自层级链 |
| 访问控制 | `canView`、`canAct`、`visibleMenuTree`、`firstVisibleLeaf`；隐藏无权限的操作 |
| 角色切换 | 仅前端 UI 行为；根据 `rolePermissions` 重新计算可见菜单/操作 |
| 系统页面 | 用户、角色、分组、权限、操作日志；FEATURES.md §4.3 中的所有 CRUD 流程 |
| 校验 | 与后端相同的边界；在表单中显示服务端的字段错误 |
| 表格 | 分页、选择、排序、空/加载/错误状态、请求取消 |
| 对话框 | 新增/编辑/删除/状态确认；焦点管理与可访问名称 |
| i18n | 中文和英文；菜单标题来自后端 |
| 演示页面 | 仪表盘、图表、地图、3D、组件库；使用适合该框架的库即可 |
| 部署 | 构建必须成功；不要为该技术栈新增 GitHub Pages workflow |

### 3.2 验证

1. 类型检查和构建通过。
2. Lint 通过（或该技术栈的等价检查）。
3. 单元测试覆盖访问过滤、code 校验和页码钳制。
4. README 记录开发服务器端口、API 基础 URL，以及哪些内容尚不完整。

## 4. 端口与默认值

| 技术栈 | 端口 | API 基础路径 |
| --- | --- | --- |
| `frontend/react` | 5173 | `VITE_BASE_API`（默认 `/api/v1/`） |
| `frontend/angular` | 4200 | `environment.apiBase` |
| `frontend/vue` | 5174 | `VITE_API_BASE` |
| `backend/springboot` | 8080 | `/api/v1` |
| `backend/go-gin-gorm` | 8081 | `/api/v1` |
| `backend/node-nestjs` | 3000 | `/api/v1` |
| `backend/csharp` | 8082 | `/api/v1` |
| `backend/rust-axum` | 8083 | `/api/v1` |
| `backend/python-fastapi` | 8000 | `/api/v1` |

数据库默认值：

```text
PostgreSQL  localhost:5432  database orange  user postgres  password postgres
MySQL       localhost:3306  database orange  user root      password root
SQLite      ./orange.db
```

每个后端都从环境变量读取连接信息，且不得硬编码凭证。

## 5. 完成定义

当满足以下条件时，某个技术栈即"达到对等"：

- 每个规范端点的行为都与参考实现一致，包括状态码和错误码。
- FEATURES.md 中的每个页面都存在，并可通过菜单访问。
- 后端能够基于 PostgreSQL 的 schema 和种子数据启动。
- 构建、测试和 README 均已就位。
- 已知缺口一节如实撰写，只有确实为空时才留空。
