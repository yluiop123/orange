# 30 分钟跑通 React + FastAPI + SQLite

本页从零启动一条真实链路（React 5173 → FastAPI 8000 → SQLite），并用一次权限状态改动确认菜单树来自数据库；第一次接手仓库、卡在环境上的读者从这里开始。

## 前置条件

| 项 | 要求 | 依据 |
| --- | --- | --- |
| Node.js | `^20.19.0` 或 `>=22.12.0` | `frontend/react` 所用 vite 8.3.5 的 `engines` |
| pnpm | 10.28.2 | `frontend/react/package.json` 的 `packageManager` |
| Python | 3.13+ | `backend/python-fastapi/pyproject.toml` 的 `requires-python` |
| `sqlite3` 命令行 | 可选 | 不想装就用步骤 2 的 Python 写法 |

两个终端；命令同时给 bash 与 PowerShell 写法。

## 步骤 1 · 装依赖

```bash
cd frontend/react
pnpm install
```

后端建议用虚拟环境：

```bash
cd backend/python-fastapi
python -m venv .venv
source .venv/bin/activate        # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
```

`requirements-dev.txt` 第一行是 `-r requirements.txt`，一次装好运行时与 pytest/httpx。

## 步骤 2 · 建库并灌种子数据

`database/sqlite/ddl.sql` 只建表，`dml.sql` 灌种子。两条脚本必须在**同一个连接**里依次执行：`dml.sql` 用 `PRAGMA foreign_keys = OFF/ON` 包住插入（组织子行先于父行出现），末尾还会跑 `foreign_key_check`。

在 `backend/python-fastapi` 目录下执行：

```bash
sqlite3 app.db < ../../database/sqlite/ddl.sql
sqlite3 app.db < ../../database/sqlite/dml.sql
```

PowerShell 用管道喂进去：

```powershell
Get-Content ../../database/sqlite/ddl.sql -Raw | sqlite3 app.db
Get-Content ../../database/sqlite/dml.sql -Raw | sqlite3 app.db
```

没有 `sqlite3` 时用 Python 标准库，一次连接跑完两个脚本：

```powershell
python -c "import sqlite3,pathlib; c=sqlite3.connect('app.db'); c.executescript(pathlib.Path('../../database/sqlite/ddl.sql').read_text(encoding='utf-8')); c.executescript(pathlib.Path('../../database/sqlite/dml.sql').read_text(encoding='utf-8')); c.close()"
```

验证：

```bash
sqlite3 app.db "SELECT COUNT(*) FROM sys_user;"
```

预期输出 `26`；库里共 10 张 `sys_*` 表、48 条权限、3 个角色、7 个组织、26 个用户（其中多数为 `status='0'` 的演示数据；可直接登录的是 `super`、`admin`、`user` 三个账号）。

为什么库建在 `backend/python-fastapi` 下：FastAPI 把 SQLite 路径当**进程工作目录的相对路径**解析（`app/config.py` 的 `sqlite_url`）。如果把 `app.db` 建在仓库根，请把 `DATABASE_URL` 指到它的绝对路径。

## 步骤 3 · 启动后端（8000）

```bash
DB_DRIVER=sqlite DB_NAME=app.db python -m app.main
```

PowerShell：

```powershell
$env:DB_DRIVER='sqlite'; $env:DB_NAME='app.db'; python -m app.main
```

- 端口优先级 `APP_PORT` → `PORT` → 8000（`app/config.py`）；换端口加 `APP_PORT=8010`。
- **不设 `DB_DRIVER` 时后端按 PostgreSQL 默认值连 `localhost:5432`**，这是最常见的“启动即连接失败”。
- 环境里若已有 `DATABASE_URL`，它会压过 `DB_DRIVER` 与 `DB_*`，先清掉。
- 预期日志出现 `Uvicorn running on http://0.0.0.0:8000`；`http://127.0.0.1:8000/docs` 是 OpenAPI UI（六栈中只有 FastAPI 默认开）。

登录接口自检，响应是 `{code,message,data,timestamp,traceId}` 且 `data.token` 非空：

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"username\":\"super\",\"password\":\"super\"}"
```

## 步骤 4 · 启动前端（5173，默认 mock）

另开一个终端：

```bash
cd frontend/react
pnpm dev
```

打开 `http://localhost:5173/#/login`（HashRouter），用 `super` / `super` 登录，应进入仪表盘并看到左侧菜单树。此时请求被 MSW 在浏览器里拦截（`.env.development` 的 `VITE_MOCK_ENABLE=true`），**后端没有参与**。

## 步骤 5 · 切到真实后端

`.env` 里的代理目标是 `http://localhost:8080`（Spring 的默认端口），所以连 FastAPI 必须同时关 mock 并改代理目标。新建 `frontend/react/.env.development.local`（被 `*.local` 规则忽略，不入库）：

```dotenv
VITE_MOCK_ENABLE=false
VITE_PROXY_TARGET=http://127.0.0.1:8000
```

重启 `pnpm dev`。浏览器请求 `http://localhost:5173/api/v1/...` 由 dev server 代理到 8000，保持同源、不会触发 CORS。

为什么不是改 `.env.local`：Vite 的加载顺序是 `.env` → `.env.local` → `.env.<mode>` → `.env.<mode>.local`，后者覆盖前者，`.env.development` 的 `VITE_MOCK_ENABLE=true` 会盖掉 `.env.local`。进程环境变量优先级最高，也可以这样临时覆盖：`$env:VITE_MOCK_ENABLE='false'`；两种都要重启 dev server。

也可以给绝对地址，此时后端必须放行来源：

```dotenv
VITE_BASE_API=http://127.0.0.1:8000/api/v1/
```

FastAPI 的 `CORS_ORIGINS` 默认只含 `http://localhost:5173`、`http://localhost:5174`、`http://localhost:4200`；用 `http://127.0.0.1:5173` 打开页面属于另一个来源，要自己加。

## 步骤 6 · 用种子账号登录

账号来自 `database/sqlite/dml.sql` 的 `sys_user`，密码存 bcrypt 哈希：

| 用户名 | 密码 | 依据 |
| --- | --- | --- |
| `super` | `super` | 三个账号的密码都等于用户名：`database/postgres/dml.sql` 的 bcrypt 哈希用 `bcrypt.checkpw` 校验通过；CI 脚本 `scripts/ci/http-smoke.mjs`、`contract-test.mjs` 也固定用 `super` 登录 |
| `admin` | `admin` | 同上（哈希校验通过） |
| `user` | `user` | 同上（哈希校验通过，且 `user` 只持有 1 个权限，适合观察菜单差异） |

其余 23 个用户多为 `status='0'` 的演示数据；需要其它账号时用 `super` 在「用户管理」里重置密码。

登录成功后前端请求 `/api/v1/auth/menus`，后端返回启用中的 `menu` / `directory` 节点，前端据此渲染左侧菜单树。

## 步骤 7 · 验证菜单树来自数据库

1. 左侧展开「系统管理」，确认有「用户管理」。
2. 进入「权限管理」，找到名称为「用户管理」、路径 `/system/user` 的行（编码 `000500`）。
3. 点该行的状态开关，把它改成禁用（`status='0'`）。
4. 按 F5 刷新：左侧「用户管理」消失。
5. 改回启用（`status='1'`）并再刷新，菜单恢复。

原因：`menu_tree()` 只查询 `status='1'` 且 `type in ('menu','directory')` 的权限；禁用权限不再出现在菜单里，禁用父节点会隐藏整支，刷新会重新请求 `/api/v1/auth/menus`。菜单不跟着变，说明你还在 mock 模式。

## 排错清单

| 现象 | 检查 |
| --- | --- |
| `pnpm dev` 报端口占用 | 5173 被别的进程占：`netstat -ano \| findstr :5173` 或 `Get-NetTCPConnection -LocalPort 5173`，或临时 `VITE_PORT=5174` 后重启 |
| 后端起不来，日志里出现 5432 | 没设 `DB_DRIVER=sqlite`，或环境里的 `DATABASE_URL` 仍指向 PostgreSQL |
| 8000 被占用 | `APP_PORT=8010` 重启后端，并把 `VITE_PROXY_TARGET` 改成同一端口 |
| 登录后数据明显是假数据 | mock 仍开：确认 `.env.development.local` 并重启 dev server；关掉后端还能登录就是 mock |
| 浏览器报 CORS | 用了绝对 `VITE_BASE_API`：来源要精确匹配 `CORS_ORIGINS`（协议+主机+端口，`127.0.0.1` 与 `localhost` 是两个来源） |
| 重灌种子报主键冲突 | 表已存在：删掉 `app.db` 后从步骤 2 重来 |
| 手写 SQL 没触发外键约束 | `PRAGMA foreign_keys` 是**每连接**设置且默认关闭，`ddl.sql` 开头那行只对执行它的连接生效。后端在 `app/db.py` 给每个连接执行 `PRAGMA foreign_keys = ON`；用 `sqlite3` 手工改数据时先执行它，再用 `PRAGMA foreign_key_check;` 检查 |

## 下一步

- 换一套后端或前端：[启动任意前后端组合](../how-to/run-a-stack.md)
- 端口与命令矩阵：[栈矩阵](../reference/stacks.md)
- 端点与响应包体：[API 参考](../reference/api.md)
- 表结构：[数据模型](../reference/data-model.md)
- mock 与真实后端的完整规则：[连接 API 与 Mock](../frontend/connect-api-and-mocks.md)

> Last verified: 24826bb · 2026-11-07
> 事实来源: `frontend/react/.env`、`frontend/react/.env.development`、`frontend/react/vite.config.ts`、`frontend/react/package.json`、`frontend/react/node_modules/vite/package.json`、`backend/python-fastapi/pyproject.toml`、`backend/python-fastapi/requirements-dev.txt`、`backend/python-fastapi/.env.example`、`backend/python-fastapi/app/config.py`、`backend/python-fastapi/app/main.py`、`backend/python-fastapi/app/db.py`、`backend/python-fastapi/app/services/menus.py`、`database/sqlite/ddl.sql`、`database/sqlite/dml.sql`、`scripts/ci/http-smoke.mjs`、`scripts/ci/contract-test.mjs`
