# 从认领 issue 到提交 PR

本页说明在本仓库接一个活的完整路径：去哪里找 issue、`Status:` 行怎么读、分支与提交怎么写、PR 该跑哪些检查；第一次给 Orange 提 PR 的人按顺序做即可。

## 1. issue 在哪里

Issue 与 spec 都是 `.scratch/` 下的 Markdown 文件，不使用托管平台的 issue 列表：

- 一个特性一个目录：`.scratch/<feature-slug>/`
- 该特性的 spec：`.scratch/<feature-slug>/spec.md`
- 实现票据：`.scratch/<feature-slug>/issues/NN-<slug>.md`，从 `01` 编号，一票一文件
- 讨论追加在文件末尾的 `## Comments` 下

现成例子：`.scratch/ui-parity/spec.md` 是视觉一致性 spec，`.scratch/ui-parity/issues/01-menu-tab-active-state.md` 起是票据。`.scratch/archive/` 是历史归档，不回收、不并入文档树。

## 2. 读懂票据头部

每张票据开头有几行状态字段，先读它们再决定接不接：

```text
Status: ready-for-agent
Type: task
Blocked by: none
```

- `Status:` 记录 triage 状态或生命周期状态，取值见下表。
- `Type:` 是票据类型（如 `task`、`research`、`prototype`）。
- `Blocked by: NN, NN` 表示依赖的票据编号；被依赖项没到 `resolved` 就不要开工。`Blocked by: none` 或没有这一行才是可做的。

| 状态字符串 | 含义 |
| --- | --- |
| `needs-triage` | 维护者还没评估 |
| `needs-info` | 等报告人补充信息 |
| `ready-for-agent` | 规格完整，可以无人值守地做 |
| `ready-for-human` | 需要人来实现 |
| `wontfix` | 不会处理 |

这些字符串与 [triage 标签](../agents/triage-labels.md) 的角色一一对应；`resolved` 是生命周期终态，不是 triage 标签。

## 3. 认领

选一张没有 `Blocked by` 阻塞、状态为 `ready-for-agent`（或维护者指派给你的）票据，在写代码前先改文件：

1. 把 `Status:` 改成 `claimed` 并保存，避免和并行的人撞车。
2. 如果要改的页面、端点或表不在票据范围内，先在 `## Comments` 下写清你的理解，等确认再扩大范围。
3. 票据引用的 spec、ADR 与代码路径都要读；`docs/adr/` 里的四个决策是硬约束。

`ready-for-human` 的票不要由代理直接认领——它通常涉及只有人才能做的判断或外部依赖。

## 4. 分支与提交

仓库没有 `CONTRIBUTING.md`，也没有强制的分支命名；从最新的 `main` 切一个短分支即可，常用 `<type>/<short-slug>`，例如 `fix/role-menu-refresh`。

提交信息沿用现有历史的前缀风格（`git log` 可见 `feat:`、`fix:`、`refactor:`、`docs:`、`style:`），写成 `<type>(<scope>): <一句话说明>`，例如 `fix(react): keep menu after role switch`。一个提交只做一件事；行为变更与对应文档放同一个 PR。

不要提交：`node_modules`、`dist`、`target`、`bin`、`obj`、本地 `.env`/`.env.local`、`backend/springboot/src/main/resources/keys/*.pem`、`*.db`。这些都在 `.gitignore` 里，用 `git status` 复核。

## 5. 该跑哪些检查

按改动范围选，完整命令与 CI 失败读法见 [提交前验证](../how-to/verify-a-change.md)：

| 改动 | 至少跑 |
| --- | --- |
| 任一前端 | 该栈的 lint、typecheck、test、build |
| 任一后端 | 该栈的 test 与 build；改了路由再加 HTTP 冒烟 |
| `contracts/openapi.json` | 六个后端的契约验收 + 三个前端的 typecheck/build |
| `database/**` | 数据库矩阵（至少 SQLite 与一个服务端引擎） |
| `docs/**` | `npm run docs:check`，并确认事实能指到代码；不需要跑构建 |

任何改动都建议先跑根目录的只读检查：

```bash
node scripts/check-config.mjs
npm run permissions:check
npm run docs:check
```

`docs:check` 只校验 Markdown 相对链接是否存在，不校验内容；它目前不在 CI 里，属于本地自查。改了权限目录或种子时先跑 `npm run permissions:sync`，否则 `permissions:check` 会失败。

## 6. 提 PR

目标分支是 `main`；CI 在 `pull_request` 到 `main` 时触发（`.github/workflows/main.yml`）。PR 描述至少写清四块：

1. **问题**：对应票据的路径（如 `.scratch/ui-parity/issues/06-final-verification.md`）与要解决的行为。
2. **改动**：改了哪些目录/契约/表；有没有跨栈影响。
3. **验证**：实际跑过的命令与结果（不要写“应该能过”）。
4. **风险与未做**：兼容性、性能、已知缺口；如果放宽了某条验收标准，写明原因。

如果 PR 只改文档，说明事实出处；如果改了契约，说明六个后端与三个前端各自改了什么。

注意 CI 的边界：PR 阶段只跑 `config`、三个前端 job 与后端矩阵的测试/构建；数据库矩阵、契约验收和 Pages 部署是 `push` 到 `main` 才跑的步骤。改了后端行为时，本地要自己补跑这两步，不能等 PR 通过。

## 7. 合并之后

1. 把票据 `Status:` 改为 `resolved`，在文件末尾补 `## Answer` 或 `## Result`，写清结论、验证数据与遗留项。
2. 若票据属于某个 spec，把结论指针补回 `spec.md` 或该特性的 `map.md`，让下一个人不用翻 PR。
3. 确认没有把临时脚本、截图产物或本地数据库带进提交。

> Last verified: 24826bb · 2026-11-07
> 事实来源: `AGENTS.md`、`docs/agents/issue-tracker.md`、`docs/agents/triage-labels.md`、`.scratch/ui-parity/{spec.md,issues/*.md}`、`.github/workflows/main.yml`、`.gitignore`、根 `package.json`、`git log`
