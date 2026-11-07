# 新增一套栈

本页解决：给仓库增加一个新前端框架或新后端语言的完整清单。
读者：维护者。新增实现必须与现有九套共享同一契约、同一数据模型。

## 1. 先决定加哪一层

| 你要加 | 目录 | 必须满足 |
| --- | --- | --- |
| 前端框架 | `frontend/<stack>/` | 消费 `contracts/openapi.json`，实现同一批页面与权限可见性 |
| 后端语言 | `backend/<stack>/` | 实现 [HTTP 契约](../reference/api.md) 的 34 个规范 operation，行为与 Spring 基准一致 |
| 数据库方言 | `database/<engine>/` | 复制 `database/postgres/ddl.sql` 与 `dml.sql` 并做方言改写，见 [数据库方言](../reference/db-dialects.md) |

## 2. 后端清单

### 2.1 代码

1. 在 `backend/<stack>/` 建工程，选一套分层结构（controller/service/repository/DTO/异常映射），与现有后端保持同样的职责划分，见 [后端架构](../backend/architecture.md)。
2. 实现 `contracts/openapi.json` 的全部**规范** operation；15 个 deprecated 端点**不要**实现。
3. 认证：Bearer JWT；登录、刷新、登出、改密、user-info、menus 六个端点缺一不可。JWT 算法与密钥来源见 [轮换 JWT 密钥](./rotate-jwt-keys.md)。
4. 响应包体、错误码、分页必须与 [HTTP 契约](../reference/api.md) 一致（`40001/40002/40101/40301/40401/429`）。
5. 操作日志：写 `sys_operation_log`，请求体脱敏截断。

### 2.2 配置

1. 提供 `.env.example`（Spring 除外，用 `application*.yaml`），变量名与现有栈对齐：`APP_PORT`、`DB_*`/`DATABASE_URL`、`JWT_SECRET`、`JWT_ISSUER`、`JWT_ACCESS_EXPIRE`、`JWT_REFRESH_EXPIRE`、`CORS_ORIGINS`。
2. 本地真实配置写进被 gitignore 的文件（`.env.local` / `.env`），并在 `.gitignore` 增加对应条目。
3. 端口默认值选一个未被占用的（现有：8080/8081/8082/8083/3000/8000）。

### 2.3 测试与 CI

1. 单元测试 + 至少一条登录到登出的集成路径。
2. 在 `.github/workflows/main.yml` 的 `backend` job 矩阵里加栈名，并补 `case` 分支的安装/测试/构建命令。
3. 本地用 `node scripts/ci/http-smoke.mjs http://127.0.0.1:<port>/api/v1` 与 `node scripts/ci/contract-test.mjs ...` 自证。
4. 数据库矩阵：确保 `scripts/ci/run-db-matrix.mjs <stack>` 能驱动你的启动命令；需要适配时改脚本而不是改 CI YAML。

## 3. 前端清单

1. 在 `frontend/<stack>/` 建工程，端口选未占用的（现有 5173/5174/4200）。
2. 实现同一批页面（系统管理五个模块 + 登录 + 错误页），目录组织参考 [前端架构](../frontend/architecture.md)。
3. API 层：从 `contracts/openapi.json` 生成或手写类型；前缀保持相对路径 `/api/v1/`，dev 用代理连后端，见 [连接 API 与 Mock](../frontend/connect-api-and-mocks.md)。
4. 权限：按当前用户可见性过滤菜单与按钮；角色切换只做前端视图过滤，不降后端权限。
5. mock：实现与现有三栈一致的登录、菜单、用户/角色/组织/权限/日志数据，保证无后端可演示。
6. 测试：单测 + 至少一条登录/菜单可见性用例；接入 `scripts/e2e/`（mock 与 real 两种驱动）。
7. 在 `.github/workflows/main.yml` 加一个前端 job（lint/typecheck/test/build）。

## 4. 文档清单（必须同提交）

1. `frontend/<stack>/README.md` 或 `backend/<stack>/README.md`：命令、目录、配置入口、本栈偏差。
2. 在 [Reference: 栈矩阵](../reference/stacks.md) 登记端口、命令、数据库支持、独有事实。
3. 若引入新环境变量：更新 [Backend 配置](../backend/configuration.md)（后端）或前端配置说明。
4. 若行为与基准不同：按 [移植取舍与偏差](../explanation/porting-and-deviations.md) 登记，说明为什么允许。
5. 刷新受影响的文档的 `Last verified`。

## 5. 验收

- [ ] 契约测试通过（全部 34 个规范 operation，无 deprecated 端点）
- [ ] 数据库矩阵通过（PG/MySQL/MariaDB/SQLite）
- [ ] 冒烟脚本通过（登录到登出）
- [ ] 三前端页面对齐（如加的是前端）
- [ ] CI 新 job 绿，配置校验与权限校验仍绿
- [ ] 栈矩阵与栈 README 已更新

> Last verified: 24826bb · 2026-11-07
> 事实来源: .github/workflows/main.yml、contracts/openapi.json、scripts/ci/run-db-matrix.mjs、scripts/ci/contract-test.mjs、backend/*/.env.example、frontend/*/package.json
