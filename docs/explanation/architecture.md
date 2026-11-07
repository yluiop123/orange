# 架构：一个产品，九套实现

本页解释 Orange 为什么把同一后台产品实现九次、共享边界画在哪些目录、CI 如何阻止实现漂移；要加栈或改契约的维护者应先读这一页。

## 1. 约束：九套实现，一份产品定义

Orange 是权限、菜单与角色管理后台。仓库里同时存在 3 个前端（React、Vue、Angular）和 6 个后端（Spring Boot、Go、NestJS、C#、Rust、FastAPI），任意前端可以配任意后端。九套实现之间没有共享运行时库：前端不互相 import，后端不共用包，唯一共同遵守的是 `contracts/openapi.json` 与 `database/` 下的结构定义。

这个形状是仓库的明确约束，而不是历史巧合。它带来两个直接收益：同一契约能否在完全不同的生态里落地，可以被 CI 持续验证；团队可以按自己的技术栈选型，而不必改产品定义。代价同样直接：同一规则要在九处各写一遍，一处契约变更要在同一提交里改完所有消费者，CI 规模也随之变大。

## 2. 与技术栈无关的四个目录

| 目录 | 拥有什么 | 不拥有什么 | 谁能改 |
| --- | --- | --- | --- |
| `contracts/` | `openapi.json`：路径、方法、参数、响应结构、错误包体、安全方案 | 运行时行为、UI 语义 | 维护者，跨栈变更时统一改 |
| `database/` | `permissions.json`（权威权限目录）、各引擎的 `ddl.sql` 结构约束与 `dml.sql` 种子数据 | 请求形状、错误文案 | 维护者，改约束或目录时同步所有引擎 |
| `docs/` | 术语、决策（ADR）、教程与参考 | 代码事实的第二份副本 | 文档维护者；数字必须回代码核实 |
| `scripts/` | 跨栈验收、种子同步、密钥生成、E2E | 产品逻辑 | 维护者 |

**契约优先**的含义是顺序，不是口号：先改 `contracts/openapi.json`，再改六个后端，再改三个前端；`database/` 的结构变化与契约变化在同一提交里发生；`docs/` 只描述已经核实的行为。栈目录只能消费这四个目录，不能反向修改它们。具体流程见 [改契约](../how-to/change-the-contract.md)。

`contracts/openapi.json` 当前解析结果为 33 个 path、49 个 operation，其中 15 个标记 `deprecated`，因此规范 operation 是 34 个。React 用 `openapi-typescript` 从该文件生成 `src/api/schema.d.ts`；其他栈不消费生成物，只按契约实现。

## 3. 运行时边界

前端与后端只通过 HTTP 通信，没有服务端渲染、没有 BFF、没有共享 session 存储。三个前端各自实现路由、菜单渲染、角色切换与权限判断；六个后端各自实现鉴权、校验、持久化与错误映射。跨栈共享的只有协议与行为，不共享代码。

这不是“尽量不共享”，而是让每个栈都能独立安装、独立构建、独立启动。代价是同一份规则存在多份实现，因此**必须一致的行为**（契约、错误码、权限语义）只能靠测试约束，不能靠类型系统约束。哪些行为必须一致、哪些允许不同，见 [移植与允许偏差](./porting-and-deviations.md)。

## 4. 产品范围

角色是数据，不是代码分支。种子数据提供 `super`、`admin`、`user` 三个角色；代码里唯一硬编码的角色标识是 `super`，用于“只有超级管理员能授予 super”“至少保留一个启用的 super”“只有 super 能重置 super 密码”三条守卫。其余角色只是权限的命名集合，可以被删除或重建。

页面由权限种子与前端页面文件共同定义：六个分组共 30 个菜单页——仪表盘 6、组件 8、图表 4、三维 2、地图 5、系统管理 5；另有 `/login`、`/forbidden`、`/not-found` 三个特殊路由，不进入菜单树。权限模型与种子结构见 [权限模型参考](../reference/permission-model.md) 与 [数据模型](../reference/data-model.md)，权威目录是 `database/permissions.json`；端点清单见 [API 参考](../reference/api.md)。

## 5. CI 如何保证一致性

`.github/workflows/main.yml` 用六类 job 把“同一产品”变成可执行断言：

| Job | 做什么 | 能证明什么 |
| --- | --- | --- |
| `config` | 跑 `scripts/check-config.mjs` 与 `npm run permissions:check` | 配置模板里的 JWT 参数与共享 API base 一致；权限目录、前端副本与 `dml.sql` 没有漂移 |
| `frontend-react` / `frontend-angular` / `frontend-vue` | lint、类型检查、测试、构建 | 三个前端各自可构建、单测通过 |
| `backend`（矩阵 `spring, go, nest, csharp, rust, fastapi`） | 各自测试与构建 | 六个后端都能编译并通过自身测试 |
| `backend` 的 Database matrix（仅 push） | `scripts/ci/run-db-matrix.mjs` | 同一后端在 PostgreSQL、MySQL、MariaDB、SQLite 上行为一致 |
| `backend` 的 Contract acceptance（仅 push） | `scripts/ci/run-contract.mjs` | 六个后端对 34 个规范 operation 的可观察行为一致 |
| `deploy`（仅 push） | 发布 React 构建到 GitHub Pages | 只有参考前端有部署产物，其他两个只构建 |

视觉一致性由 `scripts/e2e/parity.mjs` 负责截图与 diff，协议在 `.scratch/ui-parity/spec.md`，但它不在 CI 里运行。

## 6. CI 覆盖不到的地方

矩阵证明的是“被测到的行为”一致，不是“实现相同”。以下区域目前只有间接保护：

- 演示页（仪表盘、图表、地图、三维、组件）没有契约测试，只有构建与 E2E 驱动；页面能力可以不同，像素一致不要求。
- 七个数据库方言中，openGauss、OceanBase、GoldenDB 只提供静态 SQL，不进入矩阵；四个可执行引擎才是运行时承诺。
- 契约验收跑在 SQLite 上，数据库矩阵覆盖另外三个引擎，但两者的组合不是全交叉。
- 单个后端自己的单元测试决定它内部规则的质量；契约测试只检查从 HTTP 能看到的部分。

## 7. 取舍

**为什么不从契约生成九个实现。** 生成能保证形状一致，但会把所有栈锁进同一套生成器，栈不再是“独立可运行的产品”，也验证不了契约在真实生态里的可移植性。仓库选择让每个栈用本语言的习惯写，把一致性押在契约测试与 DB 矩阵上。

**为什么前端也要三套。** OpenAPI 能描述接口，却描述不了菜单可见性、角色切换、默认菜单这些 UI 语义。三套前端是这些语义的第二组证据；只保留一套，契约的“可移植”就只剩后端一半。

**为什么允许重复规则。** 硬约束在数据库、后端策略、前端预检里各出现一次是有意为之：数据库对任何写入者生效，后端给可读错误，前端省一次往返。重复的成本由“同一提交一起改”的纪律和契约测试承担，详见 [校验分层](./validation-layering.md) 与 [ADR 0004](../adr/0004-validation-layering.md)。

> Last verified: 24826bb · 2026-11-07
> 事实来源: contracts/openapi.json、database/postgres/ddl.sql、database/postgres/dml.sql、.github/workflows/main.yml、scripts/ci/run-contract.mjs、scripts/ci/run-db-matrix.mjs、frontend/react/package.json、backend/springboot/src/main/java/com/orange/security/auth/GrantGuard.java
