# 文档重建 · 写作规范（所有写作者必读）

## 任务

按 Diátaxis 重建 Orange 仓库文档。目标读者：①刚接手的新人 ②只想用某一套栈的开发者 ③维护者（加栈/改契约）。正文语言：**中文**（标题、段落、说明全中文；代码、命令、文件路径、字段名、专有名词保留英文原文）。

## 四象限判定（每篇只能属于一个）

- **tutorial**：带手走一遍，读者零基础也能得到可验证结果；必须有前置条件、步骤、预期输出、翻车排查。不写穷举参考。
- **how-to**：解决一个具体问题，读者已有基础；直接给可执行步骤，不教学。
- **reference**：信息查询，表格/清单为主；准确、完整、无叙事。
- **explanation**：讲清“为什么这样设计”，允许讨论取舍；不写操作步骤。

## 每篇硬性规范

1. 首行标题用 `# 中文标题`。
2. 标题下第一段用一句话说明“本页解决什么问题 / 谁该读”。不要写“本文档介绍了……”这类空话。
3. 文末必须有：`> Last verified: 24826bb · 2026-11-07`（有代码依据时再加一行 `> 事实来源: <文件路径…>`）。
4. 行数上限：tutorial ≤ 200，how-to ≤ 150，reference ≤ 250，explanation ≤ 200（超了拆或删）。
5. 相对链接：只允许链接到下方“最终文件树”中存在的文件；从 `docs/xxx/yyy.md` 出发用相对路径。
6. 禁止：emoji、营销语气、“如下所示”空引用、复制旧文档段落、未注明出处的数字。
7. 术语统一（以根 `CONTEXT.md` 为准）：权限 Permission、菜单权限、目录权限、操作权限、授权 Authority、页面路径 Page Path、角色 Role、权限融合、角色切换、菜单树、容器节点、菜单可见性、默认菜单、禁用权限、业务编码、同级顺序。不要用“模块/资源/按钮权限”等被明确列为 Avoid 的词。

## 事实规则（最重要）

- **只信代码**：`contracts/openapi.json`、`database/*/ddl.sql`、各栈 `package.json`/`pom.xml`/`go.mod`/`Cargo.toml`/`*.csproj`/`requirements*.txt`、`.env.example`、实际源码。**禁止**从旧文档抄数字。
- 共享事实基线在 `.scratch/docs-rebuild/facts.md`；与基线冲突时以你在代码中核实的结果为准，并在汇报里说明冲突。
- 端点数字口径：`contracts/openapi.json` 当前 33 path / 49 operation / 15 deprecated → **34 个规范 operation**。若你核实后发现不同，以 JSON 解析结果为准并报告。

## 最终文件树（链接目标，不得新增/改名）

```text
README.md                       （英文，由 Lead 写）
AGENTS.md / CONTEXT.md / CODE_OF_CONDUCT.md
docs/index.md
docs/tutorials/quickstart.md
docs/tutorials/first-contribution.md
docs/how-to/run-a-stack.md
docs/how-to/add-a-stack.md
docs/how-to/run-database-matrix.md
docs/how-to/change-the-contract.md
docs/how-to/port-a-page.md
docs/how-to/verify-a-change.md
docs/how-to/rotate-jwt-keys.md
docs/reference/stacks.md
docs/reference/api.md
docs/reference/data-model.md
docs/reference/db-dialects.md
docs/reference/permission-model.md
docs/reference/configuration.md
docs/reference/scripts.md
docs/explanation/architecture.md
docs/explanation/permission-and-menu.md
docs/explanation/validation-layering.md
docs/explanation/auth-lifecycle.md
docs/explanation/porting-and-deviations.md
docs/adr/0001-path-as-permission-identity.md      （保留，只修链接）
docs/adr/0002-backend-menu-tree.md
docs/adr/0003-code-as-tree-order.md
docs/adr/0004-validation-layering.md
docs/agents/issue-tracker.md / triage-labels.md / domain.md  （保留，只修链接）
docs/frontend/your-first-page.md
docs/frontend/add-a-page.md
docs/frontend/connect-api-and-mocks.md
docs/frontend/architecture.md
docs/frontend/design-system.md
docs/backend/add-an-endpoint.md
docs/backend/switch-database.md
docs/backend/architecture.md
docs/backend/layering-and-errors.md
docs/backend/configuration.md
frontend/react/README.md
frontend/vue/README.md
frontend/angular/README.md
backend/springboot/README.md
backend/go-gin-gorm/README.md
backend/node-nestjs/README.md
backend/csharp/README.md
backend/rust-axum/README.md
backend/python-fastapi/README.md
```

## 允许你改动的范围

只写你被分配的文件；**不要**删除旧文件、不要改旧文件、不要改 `docs/adr/` 与 `docs/agents/`。旧文件由 Lead 在集成阶段统一 `git rm`。

## 汇报格式（完成后用 send_message 给 lead）

```text
完成文件（相对路径 + 行数）：
- docs/... 123 行
事实核实：逐条列出你从哪个文件核到了什么（端口/端点/表/命令/环境变量）
冲突与风险：与 facts.md 不一致之处、你不确定的说法
```

## 质量自检（提交汇报前逐条过）

- [ ] 每篇都能归入四象限之一，且没有跨象限内容
- [ ] 所有表格数字都能指到代码出处
- [ ] 所有相对链接都存在于上面文件树
- [ ] 没有 emoji、没有营销句子、没有“本文档介绍”式开头
- [ ] 术语与 CONTEXT.md 一致
- [ ] 行数在上限内
