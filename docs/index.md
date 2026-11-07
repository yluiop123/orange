# 文档地图

Orange 的全部文档都在 `docs/`（技术栈无关）+ 每个栈自己的 `README.md`（命令与偏差）。
本页解决：**我该读哪一篇**，以及改文档时要遵守的规则。

## 1. 按角色选阅读路径

### 刚接手项目

1. 根 [README.md](../README.md) —— 这是什么、怎么跑起来
2. [Tutorial: 30 分钟跑通一套栈](./tutorials/quickstart.md)
3. [Explanation: 架构](./explanation/architecture.md) —— 为什么是一个产品九套实现
4. [Explanation: 权限与菜单模型](./explanation/permission-and-menu.md) —— 读懂业务核心
5. [Tutorial: 第一个贡献](./tutorials/first-contribution.md) —— 认领 issue 到提交 PR

### 只用某一套栈

1. 对应栈的 README：`frontend/<stack>/README.md` 或 `backend/<stack>/README.md`
2. [Reference: 栈矩阵](./reference/stacks.md) —— 端口、命令、数据库支持
3. [How-to: 启动任意一套栈](./how-to/run-a-stack.md)
4. 前端另读 [连接 API 与 Mock](./frontend/connect-api-and-mocks.md)；后端另读 [Backend 配置](./backend/configuration.md)

### 维护者（加栈 / 改契约）

1. [Explanation: 移植取舍与偏差](./explanation/porting-and-deviations.md)
2. [How-to: 新增一套栈](./how-to/add-a-stack.md)
3. [How-to: 修改契约](./how-to/change-the-contract.md)
4. [How-to: 跑数据库矩阵](./how-to/run-database-matrix.md) 与 [提交前验证](./how-to/verify-a-change.md)

### AI 代理

1. 根 [AGENTS.md](../AGENTS.md) —— 代理入口与约定
2. [CONTEXT.md](../CONTEXT.md) —— 领域词汇表（术语的唯一权威）
3. [docs/agents/](./agents/) —— issue 跟踪、triage 标签、领域文档规则
4. [ADR](./adr/) —— 已定型的架构决策，改动前必读

## 2. 四象限索引

### Tutorials（学习）

| 文档 | 内容 |
| --- | --- |
| [quickstart.md](./tutorials/quickstart.md) | 30 分钟：安装、起后端与前端、登录、改一个权限并验证 |
| [first-contribution.md](./tutorials/first-contribution.md) | 从 `.scratch/` 认领 issue 到提 PR |

### How-to（任务）

| 文档 | 解决什么问题 |
| --- | --- |
| [run-a-stack.md](./how-to/run-a-stack.md) | 启动任意前后端组合、连 mock 或真实后端 |
| [add-a-stack.md](./how-to/add-a-stack.md) | 新增一套前端或后端实现 |
| [run-database-matrix.md](./how-to/run-database-matrix.md) | 本地/CI 跑四引擎矩阵 |
| [change-the-contract.md](./how-to/change-the-contract.md) | 改 OpenAPI 并让九套实现跟上 |
| [port-a-page.md](./how-to/port-a-page.md) | 在 React→Vue→Angular 同步一个页面 |
| [verify-a-change.md](./how-to/verify-a-change.md) | 提交前该跑哪些检查 |
| [rotate-jwt-keys.md](./how-to/rotate-jwt-keys.md) | 生成/轮换 JWT 密钥 |

### Reference（查阅）

| 文档 | 内容 |
| --- | --- |
| [stacks.md](./reference/stacks.md) | 九套栈的端口/命令/数据库矩阵（**唯一事实源**） |
| [api.md](./reference/api.md) | HTTP 契约：端点、包体、错误码、分页、认证 |
| [data-model.md](./reference/data-model.md) | 十张表的字段与不变量 |
| [db-dialects.md](./reference/db-dialects.md) | 七种数据库的方言差异与加载方式 |
| [permission-model.md](./reference/permission-model.md) | 权限/菜单/角色字段级参考 |
| [configuration.md](./reference/configuration.md) | 配置加载顺序与文件位置 |
| [scripts.md](./reference/scripts.md) | 全部脚本的用途与用法 |

### Explanation（理解）

| 文档 | 内容 |
| --- | --- |
| [architecture.md](./explanation/architecture.md) | 一个产品、九套实现、契约优先的边界 |
| [permission-and-menu.md](./explanation/permission-and-menu.md) | path 即身份、编码即顺序、角色融合、菜单可见性 |
| [validation-layering.md](./explanation/validation-layering.md) | 三层校验的职责划分 |
| [auth-lifecycle.md](./explanation/auth-lifecycle.md) | 登录/刷新/登出/强制改密/令牌吊销 |
| [porting-and-deviations.md](./explanation/porting-and-deviations.md) | 移植取舍与“允许偏差”的登记方式 |

### 栈级与领域

| 位置 | 内容 |
| --- | --- |
| `frontend/<stack>/README.md` | 前端各栈的命令、目录、独有依赖与偏差 |
| `backend/<stack>/README.md` | 后端各栈的命令、目录、配置入口与偏差 |
| [docs/backend/](./backend/) | 后端共性：加端点、切库、分层与错误码、配置 |
| [docs/frontend/](./frontend/) | 前端共性：加页面、连 API、架构、设计系统 |
| [docs/adr/](./adr/) | 架构决策记录 0001–0004 |
| [CONTEXT.md](../CONTEXT.md) | 领域词汇表，术语以它为准 |

## 3. 文档维护规则

1. **一个事实只写一处**：端口/命令只在 `reference/stacks.md`；端点只在 `reference/api.md`；表结构只在 `reference/data-model.md`；后端变量只在 `backend/configuration.md`。其他文档引用，不复制。
2. **四象限不混写**：教程不给完整参考表，参考不写教学步骤，解释篇不复述操作步骤。
3. **事实以代码为准**：写文档时读 `contracts/openapi.json`、`database/*/ddl.sql`、各栈清单文件与源码，不抄旧文档数字。
4. **每篇标注校验点**：文末 `> Last verified: <commit> · <date>`，改过内容就必须更新它。
5. **归档不回收**：历史决策与旧版文档在 [`.scratch/archive/`](../.scratch/archive/)，不并入现行文档树。

> Last verified: 24826bb · 2026-11-07
