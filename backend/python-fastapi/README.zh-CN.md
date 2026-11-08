[English](README.md) | 简体中文

# Orange · Python + FastAPI 后端

用 Python + FastAPI 实现共享 API 契约，行为以 Spring Boot 基准为准。一个进程通过
`DB_DRIVER` / `DATABASE_URL` 连接一种数据库。后端共同约定见
[../README.zh-CN.md](../README.zh-CN.md)。

## 技术栈与依赖

| 项 | 版本 / 说明 | 来源 |
| --- | --- | --- |
| Python | 3.13+ | `pyproject.toml` |
| Web | FastAPI `>=0.115,<1.0`、uvicorn `>=0.32,<1.0` | `requirements.txt` |
| ORM 与驱动 | SQLAlchemy `>=2.0,<3.0`、`psycopg[binary]`、`PyMySQL` | `requirements.txt` |
| 校验 | pydantic `>=2.9,<3.0` | `requirements.txt` |
| 认证 | PyJWT、`cryptography`、`bcrypt` | `requirements.txt` |
| 其他 | `python-dotenv` | `requirements.txt` |
| 测试 | pytest、httpx（在 `requirements-dev.txt`） | `requirements-dev.txt` |
| API 文档 | FastAPI/Pydantic；`/swagger` + `/openapi.json` | `app/main.py` |
| 构建 | 无；解释型应用 | `pyproject.toml` |

## 环境要求与命令

先创建虚拟环境。

| 用途 | 命令 |
| --- | --- |
| 安装 | `pip install -r requirements-dev.txt` |
| 启动 | `python -m app.main` |
| 启动（CLI） | `uvicorn app.main:app --port 8000` |
| 测试 | `python -m pytest -q` |
| 构建 | 无 |
| 冒烟 | `python scripts/smoke_http.py --base-url http://127.0.0.1:8000` |

用 CLI 启动时 `--port` 优先，`PORT` / `APP_PORT` 不生效。`pyproject.toml` 设置了
`testpaths=["tests"]`、`pythonpath=["."]` 和 `addopts="-q"`。

## 目录结构与分层

```text
app/main.py            应用工厂、CORS、TraceId、审计中间件、路由挂载
app/config.py          Settings：环境变量、驱动归一化、URL 拼装
app/db.py              SQLAlchemy engine / session
app/envelope.py        响应包体
app/errors.py          错误码与异常处理器
app/middleware.py      审计中间件
app/models/            共享 schema 的 ORM 模型
app/policies/          编码、权限、树索引策略
app/schemas/           请求与响应模型
app/routers/           auth、users、roles、groups、permissions、operation_logs、docs
app/security/          JWT、refresh Cookie、锁定、密码、授权依赖
app/services/          业务逻辑、菜单树、查询工具
tests/                 pytest 用例与 conftest
scripts/               smoke_http.py、smoke_pg.py
```

## API、认证与数据库访问

- 路由用依赖声明 Authority，绑定 Pydantic schema 并调用 service。
  `app/errors.py` 的异常处理器生成统一包体。
- JWT 使用 PyJWT：同时配置 RSA 密钥对时用 RS256，否则用 `JWT_SECRET` 的 HS256。
  refresh token 在 HttpOnly Cookie 中轮换。
- SQLAlchemy 映射共享 schema；应用从不建表。`DATABASE_URL` 接受短 scheme，并自动
  补全 SQLAlchemy 方言。
- 审计日志清理是进程内 asyncio 任务：启动 60 秒后第一次运行，之后每天一次。
- 测试使用内存 SQLite（`sqlite+pysqlite:///:memory:`），不需要数据库服务。

## 服务配置

| 配置项 | 当前值 | 配置位置 | 修改方式 |
| --- | --- | --- | --- |
| HTTP 端口 | `8000` | `app/config.py`：`APP_PORT` → `PORT` → 8000 | 在 `.env` 设置 `APP_PORT`，或给 uvicorn 传 `--port` |
| API 前缀 | `/api/v1` | `app/main.py` / 路由 | — |
| Swagger | `/swagger`、`/openapi.json` | `app/main.py` | — |
| CORS | React/Vue/Angular 开发地址 | `CORS_ORIGINS` | 修改 `.env` |
| 本地配置 | `.env` | 本栈根目录 | 从 `.env.example` 复制 |

## 数据库配置

| 配置项 | 当前值 | 配置位置 |
| --- | --- | --- |
| 引擎 | PostgreSQL | `DATABASE_URL` → `DB_DRIVER` + `DB_*` → 默认 |
| 连接 URL | `DATABASE_URL` 接受 `postgresql+psycopg://...` 与短 scheme | `app/config.py` |
| 离散值 | `DB_HOST`、`DB_PORT`、`DB_NAME`、`DB_USER`、`DB_PASSWORD` | `app/config.py` |
| SQLite 文件 | `DB_NAME` 或 URL 路径 | `app/config.py` |
| 表结构 | SQLAlchemy 模型；不建表/不迁移 | `app/models/` |

## 切库

| 目标库 | 依赖 / 驱动 | 配置 | 初始化 | 说明 |
| --- | --- | --- | --- | --- |
| PostgreSQL | `psycopg[binary]`（已安装） | `DATABASE_URL=postgresql+psycopg://...` 或 `DB_DRIVER=postgres` | 依次执行 `database/postgres/ddl.sql`、`dml.sql` | 基线 |
| MySQL | `PyMySQL` | `DATABASE_URL=mysql+pymysql://...` 或 `DB_DRIVER=mysql` | 依次执行 `database/mysql/ddl.sql`、`dml.sql` | 自动补 SQLAlchemy 方言 |
| MariaDB | `PyMySQL` | `DB_DRIVER=mariadb`，MariaDB URL/端口 | 依次执行 `database/mariadb/ddl.sql`、`dml.sql` | MySQL 协议 |
| SQLite | Python `sqlite3` | `DB_DRIVER=sqlite`，`DATABASE_URL=sqlite:///./orange.db` 或 `DB_NAME` | 依次执行 `database/sqlite/ddl.sql`、`dml.sql` | 测试使用内存 SQLite |

步骤：按引擎建库，先执行 `ddl.sql` 再执行 `dml.sql`，设置驱动与 URL 或 `DB_*`，
重启后用种子账号验证。

## 环境配置

| 环境 | 配置 |
| --- | --- |
| 开发 | `.env`（已 gitignore），由 `load_dotenv(".env")` 读取；进程环境变量优先 |
| 测试 | `python -m pytest -q`；使用内存 SQLite |
| 生产 | 进程环境变量；使用 RSA 密钥对或强 `JWT_SECRET` |

## 延伸阅读

- [后端共同约定](../README.zh-CN.md)
- [数据库](../../database/README.zh-CN.md)
- [仓库 README](../../README.zh-CN.md)
