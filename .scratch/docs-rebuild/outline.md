# 文档全量重建 · 大纲（待批准）

> 状态：草案 v1 · 2026-11-07
> 依据：`project-analysis` + `documentation-writer`（Diátaxis 四象限）
> 批准后才进入写入阶段。

## 0. 决策摘要

| 项 | 决定 |
| --- | --- |
| 范围 | 全仓库文档 53 篇（`.scratch/` 归档与 `CODE_OF_CONDUCT.md` 除外） |
| 目标读者 | 新人开发者 · 单栈使用者 · 维护者（加栈/改契约） |
| 结构 | 单一 `docs/` 树 + 每栈 README；树内严格按 Diátaxis 四象限分区 |
| 语言 | 默认全中文（待确认；见 §7 决策点 1） |
| 写入方式 | 先本大纲 → 批准 → 分阶段写入 → 每阶段可单独回滚 |
| 旧文件 | 允许改名/合并/删除，用 3 个提交分段完成（待确认） |

## 1. 四条硬规则

1. **一个事实只出现一次**：端口/命令/端点/表结构只允许写在对应 reference 文档里，其余文档一律链接。
2. **四象限不混写**：教程不放参考表，参考不写教学步骤，解释篇不复述操作步骤。
3. **每篇有上限**：教程 ≤ 200 行，how-to ≤ 150 行，reference ≤ 250 行，explanation ≤ 200 行。
4. **每篇可核对**：文末标注 `Last verified: <commit> · <date>`；事实必须引用代码/契约出处，禁止从旧文档转抄数字。

## 2. 目标结构

```
README.md                         重写：中文门面 + 5 分钟上手 + 文档入口
AGENTS.md                         轻改：只保留代理约定与入口
CONTEXT.md                        轻改：领域词汇表（保留根位置）
CODE_OF_CONDUCT.md                不动
docs/
├── index.md                      【新】唯一文档地图 + “我该读哪篇”决策表
├── tutorials/
│   ├── quickstart.md             30 分钟跑通 React + FastAPI + SQLite
│   └── first-contribution.md     从 .scratch 认领 issue 到提 PR
├── how-to/
│   ├── run-a-stack.md            启动任意前后端组合、端口与环境变量
│   ├── add-a-stack.md            新增一套前端或后端（合并旧 PORTING）
│   ├── run-database-matrix.md    本地/CI 跑 4 引擎矩阵
│   ├── change-the-contract.md    改 OpenAPI 的正确顺序（契约→文档→6 后端→3 前端）
│   ├── port-a-page.md            在 React→Vue→Angular 同步一个页面
│   ├── verify-a-change.md        提交前该跑什么、CI 失败怎么读
│   └── rotate-jwt-keys.md        生成/轮换密钥（合并旧 security/jwt-keys）
├── reference/
│   ├── stacks.md                 9 套栈的端口/命令/测试命令矩阵（唯一事实源）
│   ├── api.md                    HTTP 契约：33 path / 49 operation / 34 canonical / 15 deprecated
│   ├── data-model.md             ER、表清单、不变量、DDL/DML 位置
│   ├── db-dialects.md            引擎矩阵与方言差异（吸收 7 个 engine README + DB-MATRIX）
│   ├── permission-model.md       权限/菜单/角色字段级参考
│   ├── configuration.md          全部环境变量与配置文件位置（跨栈唯一清单）
│   └── scripts.md                scripts/、scripts/ci、scripts/e2e 用法
├── explanation/
│   ├── architecture.md           为什么一套产品 9 套栈、目录边界规则
│   ├── permission-and-menu.md    path 即身份、编码即顺序、角色融合、菜单可见性
│   ├── validation-layering.md    三层校验为何这样分（旧 validation-rules 瘦身）
│   ├── auth-lifecycle.md         登录/刷新/登出/强制改密时序
│   └── porting-and-deviations.md 移植取舍与“允许偏差”的登记方式
├── adr/                          保留 0001–0004
├── agents/                       保留 issue-tracker / triage-labels / domain
├── frontend/
│   ├── your-first-page.md        tutorial
│   ├── add-a-page.md             how-to
│   ├── connect-api-and-mocks.md  how-to（mock ↔ 真实后端切换）
│   ├── architecture.md           explanation（吸收旧 frontend/docs/ARCHITECTURE）
│   └── design-system.md          reference（吸收旧 STYLE-GUIDE，给 token 表）
└── backend/
    ├── add-an-endpoint.md        tutorial
    ├── switch-database.md        how-to（吸收旧 backend/docs/CONFIGURATION）
    ├── architecture.md           explanation
    ├── layering-and-errors.md    reference（分层、错误码、响应包体）
    └── configuration.md          reference

frontend/{react,vue,angular}/README.md    重写为纯 Reference：命令 + 目录 + 本栈独有差异
backend/{springboot,go-gin-gorm,node-nestjs,csharp,rust-axum,python-fastapi}/README.md  同上
```

**规模变化**：53 篇 → 约 43 篇；586 KB → 目标 ≤ 300 KB；同一事实的出现次数从最多 6 次降到 1 次。

## 3. 旧文件处置

| 旧文件 | 处置 |
| --- | --- |
| `README.zh-CN.md` | 与 `README.md` 合并为单语版本后删除 |
| `docs/README.md` | 重写为 `docs/index.md` |
| `docs/API.md` | → `docs/reference/api.md` |
| `docs/DATABASE.md` | → `docs/reference/data-model.md` |
| `docs/STACKS.md` | → `docs/reference/stacks.md` |
| `docs/DB-MATRIX.md` | 并入 `docs/reference/db-dialects.md` |
| `docs/FEATURES.md` | 产品范围进 `explanation/architecture.md`，页面清单进 `reference/stacks.md` 附录 |
| `docs/PORTING.md` | → `how-to/add-a-stack.md` + `explanation/porting-and-deviations.md` |
| `docs/VERIFICATION.md` | 可操作部分 → `how-to/verify-a-change.md`；历史记录移入 `.scratch/archive/` |
| `docs/validation-rules.md` | → `explanation/validation-layering.md`（20.8 KB 目标 ≤ 10 KB） |
| `docs/security/jwt-keys.md` | 并入 `reference/configuration.md` + `how-to/rotate-jwt-keys.md` |
| `docs/audits/`（空目录） | 删除 |
| `docs/adr/`、`docs/agents/` | 保留，仅修链接 |
| `frontend/docs/*`（7 篇） | → `docs/frontend/*`（5 篇）；两份 `.zh-CN` 重复版删除 |
| `backend/docs/*`（6 篇） | → `docs/backend/*`（5 篇）；两份 `.zh-CN` 重复版删除 |
| `database/*/README.md`（7 篇，61.9 KB） | 合并为 `docs/reference/db-dialects.md`；第三方外链清单不迁移 |
| `scripts/ci/README.md`、`scripts/e2e/README.md` | 并入 `docs/reference/scripts.md` |
| `frontend/*/README.md`、`backend/*/README.md`（9 篇） | 原地重写，只留命令/目录/本栈偏差 |

## 4. 链接迁移

- 当前有 **68 处**相对链接跨文件指向 `docs/`、`frontend/docs/`、`backend/docs/`，分布在 19 个文件。
- 迁移方式：先建 `docs/index.md`，再按处置表批量改写；不保留旧路径（避免双份真相）。
- 新增 `scripts/check-docs-links.mjs`（纯 Node，无依赖）校验全部相对链接，可选接入 CI 的 `config` job（见 §7 决策点 3）。

## 5. 事实核对机制

阶段 0 先产出 `.scratch/docs-rebuild/facts.md`，作为所有写作的事实基线：

- **栈矩阵**：9 套栈的端口、启动命令、测试命令（从各 `package.json` / `pom.xml` / `go.mod` / `Cargo.toml` / `*.csproj` / `requirements*.txt` 读取）
- **契约**：`contracts/openapi.json` 的 33 path / 49 operation / 15 deprecated；与 `docs/reference/api.md` 逐条对齐
- **数据模型**：`database/*/ddl.sql` 的表清单与不变量（方言差异单列）
- **环境变量**：`.env*`、`application*.yml`、`app/config.py` 等实际配置
- **脚本**：`scripts/` 下 17 个脚本的入口与参数

写作期间禁止引用旧文档中的数字；每篇完成后由我抽查（覆盖率 20%，优先查端口、端点、表名、命令）。

## 6. 执行计划（含并行分工）

| 阶段 | 内容 | 执行者 | 产品 |
| --- | --- | --- | --- |
| 0 | 事实基线 | 我 | `.scratch/docs-rebuild/facts.md` |
| 1 | `docs/tutorials` + `docs/how-to` | 代理 A | 9 篇 |
| 1 | `docs/reference`（除 db-dialects） | 代理 B | 6 篇 |
| 1 | `docs/explanation` + agent 文档修链接 | 代理 C | 5 篇 |
| 2 | `docs/frontend/*` + 3 个前端 README | 代理 D | 8 篇 |
| 2 | `docs/backend/*` + 6 个后端 README | 代理 E | 11 篇 |
| 3 | `docs/index.md`、`reference/db-dialects.md`、`reference/configuration.md`、根 README/AGENTS/CONTEXT | 我 | 6 篇 |
| 4 | 删除旧文件、链接迁移、校验、抽查、分 3 个提交 | 我 | — |

并行代理的写入范围互不重叠（各自独占目录），阶段 0 的事实基线是唯一共享输入。

**提交拆分**：①新增 `docs/` 新树与事实基线；②改写各栈 README 与根 README；③删除旧文件并修链接。任一提交都可单独回滚。

## 7. 需要你决定的 3 件事

1. **语言**：默认「全中文（含标题与正文，代码/命令保留原文）」，根 README 也改为中文单语。若你还想让仓库对英文读者友好，则改为「英文正文 + 中文根 README」。
2. **旧文件处置**：默认「允许 git rm / 改名」。若你希望外部链接（博客、Issue 里贴过的地址）仍可用，则保留旧路径的 3 行转发索引。
3. **校验脚本**：是否允许新增 `scripts/check-docs-links.mjs` 并加一条 npm script（不强制接入 CI）。

## 8. 验收标准

- 相对链接死链 = 0（脚本校验）
- 端口/端点/表名/命令抽查一致率 = 100%
- 单一事实源：`reference/stacks.md` 之外不得再出现端口表
- 文档总体积 ≤ 300 KB；单篇不超 §1 上限
- `node scripts/check-config.mjs` 与 `npm run permissions:check` 仍通过

## 9. 风险

| 风险 | 应对 |
| --- | --- |
| 改名导致链接遗漏 | 链接校验脚本 + 分 3 次提交 |
| 旧文档里的真实细节（偏差说明、历史决策）被丢弃 | 阶段 0 建「不可丢事实清单」，逐条指定新归属 |
| 生成内容与代码不符 | 每篇标注事实出处；抽查 20%；CI 配置校验兜底 |
| 工作量 | 5 个代理并行，阶段 1 与 2 可扛住 43 篇 |
