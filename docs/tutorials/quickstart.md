# 30 分钟跑通 React + FastAPI + SQLite

本页带你在本机用种子账号登录，并完成一次“给角色加权限、换账号看到菜单变化”的闭环；第一次接手仓库、想确认前后端确实能通的人按顺序照做即可。

## 前置条件

| 项 | 要求 | 依据 |
| --- | --- | --- |
| Python | 3.13 | `backend/python-fastapi/README.md` |
| Node.js | `^20.19.0` 或 `>=22.12.0` | `frontend/react` 所用 vite 8.3.5 的 `engines` |
| pnpm | 10.28.2 | `frontend/react/package.json` 的 `packageManager` |
| 浏览器 | 任意现代浏览器 | — |

命令以 PowerShell 为例；macOS/Linux 把 `.\venv\Scripts\python` 换成 `.venv/bin/python`。本教程不装数据库服务：后端默认连 PostgreSQL，下面用环境变量把它覆盖成 SQLite 文件。

## 1. 装前端依赖

```powershell
cd frontend/react
pnpm install
```

预期：`node_modules` 生成，命令以 `Done` 结束。锁文件是 `pnpm-lock.yaml`，不要改用 npm 安装。

## 2. 准备 Python 环境与 SQLite

```powershell
cd backend/python-fastapi
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements-dev.txt
```

`requirements-dev.txt` 在运行时依赖之上加了 `pytest` 与 `httpx`。然后建库并灌入共享 schema 与种子数据：

```powershell
.\.venv\Scripts\python -c "import sqlite3,pathlib; c=sqlite3.connect('orange-fastapi.db'); c.executescript(pathlib.Path('../../database/sqlite/ddl.sql').read_text(encoding='utf-8')); c.executescript(pathlib.Path('../../database/sqlite/dml.sql').read_text(encoding='utf-8')); c.close()"
```

预期：`backend/python-fastapi/orange-fastapi.db` 生成；库中有 10 张 `sys_*` 表、48 条权限、3 个角色、7 个组织。种子账号是 `super/super`、`admin/admin`、`user/user`（`database/sqlite/dml.sql` 与后端 README）。

`database/sqlite/dml.sql` 内部先关闭外键再灌组织（子行先于父行出现），必须在同一个连接里一次执行完；上面的 `executescript` 满足这一点。

## 3. 启动后端并自检

```powershell
$env:DB_DRIVER="sqlite"
$env:DB_NAME="./orange-fastapi.db"
.\.venv\Scripts\python -m app.main
```

预期日志出现 `Uvicorn running on http://0.0.0.0:8000`。`DB_NAME` 是相对当前目录的路径；`DATABASE_URL` 若已设置会压过 `DB_DRIVER` 与 `DB_*`，先清掉它。另一个终端自检：

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/v1/auth/login -ContentType 'application/json' -Body '{"username":"super","password":"super"}'
```

预期输出的 `code` 是 `200`，`data.token` 非空；交互式接口文档在 `http://127.0.0.1:8000/docs`。用 `curl` 时注意 Windows PowerShell 会吞掉 JSON 里的双引号，优先用上面的 `Invoke-RestMethod`。

## 4. 启动前端

```powershell
cd frontend/react
$env:VITE_MOCK_ENABLE="false"
$env:VITE_PROXY_TARGET="http://127.0.0.1:8000"
pnpm dev
```

预期 Vite 打印 `Local: http://localhost:5173/`。React 用 HashRouter，登录页是 `http://localhost:5173/#/login`。

`VITE_MOCK_ENABLE` 必须显式设为 `false`：`.env.development` 默认把它设为 `true`，而 Vite 的加载顺序是 `.env` → `.env.local` → `.env.development` → `.env.development.local`，后者覆盖前者，所以改 `.env.local` 不会关掉开发模式的 mock；进程环境变量优先级最高，改完要重启 dev server。`VITE_PROXY_TARGET` 指向刚启动的 FastAPI，浏览器只看到 5173 的同源请求，不需要 CORS。

## 5. 用种子账号登录

打开 `http://localhost:5173/#/login`，输入 `super` / `super`。

预期：进入布局，左侧出现 6 个顶级菜单——仪表盘、组件、图表、三维、地图、系统管理。`/api/v1/auth/menus` 返回的是全部启用的 `menu`/`directory` 节点；当前账号能看到哪些，由前端按 `rolePermissions` 过滤（React 在 `src/lib/access.ts`）。

## 6. 改一个权限并验证生效

1. 打开“系统管理 → 角色管理”。
2. 在“用户”角色一行点“编辑”。
3. 在权限树里勾选“组件”（`/component`）与“通用组件”（`/component/general`），保存。请求是 `PATCH /api/v1/system/roles/user`，`permissions` 是权限 id 数组。
4. 退出登录，改用 `user` / `user` 登录。

预期：登录后左侧出现“组件 → 通用组件”，点开进入 `/component/general`。改动前 `user` 角色只有 `0000`（仪表盘目录权限），所以这个账号原本只看得到仪表盘。

必须同时勾选父节点与至少一个子节点：`组件` 是 `menu` 类型的容器，子节点都不可见时容器本身也不显示；`/dashboard` 是 `directory` 类型，按路径前缀覆盖子菜单，所以只给 `0000` 就能看到整组仪表盘。

## 7. 收尾

前端 `Ctrl+C` 停 Vite；后端 `Ctrl+C` 停 uvicorn。想保留数据就留着 `orange-fastapi.db`，想重来就删掉它并从第 2 步重灌。

## 常见翻车

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 后端启动报连不上 `5432` | `DB_DRIVER` 没设，或 `.env`/环境里的 `DATABASE_URL` 仍指向 PostgreSQL | 在同一个终端重设 `DB_DRIVER=sqlite` 与 `DB_NAME`，并清掉 `DATABASE_URL` |
| 登录页能开，所有接口 404 或一直转圈 | 前端仍在 mock，或代理目标指错端口 | 用进程环境变量设 `VITE_MOCK_ENABLE=false`、`VITE_PROXY_TARGET=http://127.0.0.1:8000`，重启 `pnpm dev` |
| 改了 `.env.local` 的 mock 开关不生效 | `.env.development` 优先级更高 | 改用 `.env.development.local` 或进程环境变量，并重启 dev server |
| 浏览器控制台报 CORS | 把 `VITE_BASE_API` 改成绝对地址直连，Origin 不在 `CORS_ORIGINS` 里 | 回到代理写法，或把该 Origin 加进后端 `CORS_ORIGINS` |
| 8000 被占用 | 上一个 uvicorn 没退，或其他服务占用 | `Get-NetTCPConnection -LocalPort 8000` 找到进程后停掉，或换 `APP_PORT` 并同步改代理目标 |
| 5173 被占用 | 另一个 dev server 在跑 | 停掉旧进程，或设 `VITE_PORT` 换端口 |
| 重灌种子报主键冲突 | 表已存在 | 删除 `orange-fastapi.db` 后重新执行第 2 步 |
| 没装 `sqlite3` 命令行 | 本教程只用 Python 标准库 | 继续用第 2 步的 Python 命令，不需要额外客户端 |

> Last verified: 24826bb · 2026-11-07
> 事实来源: `backend/python-fastapi/README.md`、`backend/python-fastapi/app/{main.py,config.py,db.py}`、`backend/python-fastapi/.env.example`、`backend/python-fastapi/requirements-dev.txt`、`database/sqlite/{ddl.sql,dml.sql}`、`frontend/react/{package.json,vite.config.ts,.env,.env.development}`、`frontend/react/src/{main.tsx,App.tsx,lib/access.ts,lib/page-routes.ts}`、`frontend/react/node_modules/vite/dist/node/chunks/node.js`、`contracts/openapi.json`
