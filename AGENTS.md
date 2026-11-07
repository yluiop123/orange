# AGENTS.md

## 入口

- 文档地图：[`docs/index.md`](docs/index.md)（正文为中文，按 Diátaxis 四象限组织）
- 领域词汇：[`CONTEXT.md`](CONTEXT.md)，术语以它为准
- 架构决策：[`docs/adr/`](docs/adr/)，改动相关区域前先读

## Agent 工作约定

### Issue tracker

Issue 与 spec 是 `.scratch/` 下的 Markdown 文件，见 [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md)。`.scratch/archive/` 是历史归档，不回收、不并入文档树。

### Triage labels

默认标签：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`，见 [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md)。

### Domain docs

单上下文：根 `CONTEXT.md` + `docs/adr/`，见 [`docs/agents/domain.md`](docs/agents/domain.md)。

### 文档

- 事实以代码与契约为准：`contracts/openapi.json`、`database/*/ddl.sql`、各栈清单文件；不抄旧文档数字。
- 一个事实只写一处：端口/命令 → `docs/reference/stacks.md`，端点 → `docs/reference/api.md`，表 → `docs/reference/data-model.md`，后端变量 → `docs/backend/configuration.md`。
- 每篇文末维护 `> Last verified: <commit> · <date>`。
