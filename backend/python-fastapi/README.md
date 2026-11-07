# Orange · Python + FastAPI 后端

本栈用 Python + FastAPI 实现同一份接口契约，行为以 Spring Boot 基准为准；一个进程通过 `DB_DRIVER` / `DATABASE_URL` 连一种数据库。

## 技术栈与版本

| 项 | 版本 / 说明 | 来源 |
| --- | --- | --- |
| Python | `>=3.13`（CI 用 3.13） | `pyproject.toml`、`main.yml` |
| Web | FastAPI `>=0.115,<1.0`、`uvicorn[standard]` `>=0.32,<1.0` | `requirements.txt` |
| ORM 与驱动 | SQLAlchemy `>=2.0,<3.0`、`psycopg[binary]` `>=3.2,<4.0`、`PyMySQL` `>=1.1,<2.0` | `requirements.txt` |
| 校验 | pydantic `>=2.9,<3.0` | `requirements.txt` |
| 认证 | PyJWT `>=2.9,<3.0`（HS256）、`bcrypt` `>=4.2,<6.0` | `requirements.txt` |
| 其他 | `python-dotenv` `>=1.0,<2.0` | `requirements.txt` |
| 测试依赖 | pytest `>=8.3,<10.0`、httpx `>=0.27,<1.0`（在 `requirements-dev.txt`，含 `-r requirements.txt`） | `requirements-dev.txt` |
| 接口文档 | 框架自带：`FastAPI()` 未改 `docs_url`，`/docs` 默认可用 | `app/main.py:61` |
| 构建 | 无构建/打包步骤（解释型，`pyproject.toml` 只含元数据与 pytest 配置） | `pyproject.toml` |

## 命令

| 用途 | 命令 | 来源 / 说明 |
| --- | --- | --- |
| 安装 | `pip install -r requirements-dev.txt` | `main.yml`（backend job, fastapi）；需先建 venv |
| 启动 | `python -m app.main` | `app/main.py` 的 `__main__` 分支调用 `uvicorn.run(port=settings.port)` |
| 启动（CLI） | `uvicorn app.main:app --port 8000` | CLI 自带 `--port`，此时 `PORT` / `APP_PORT` 不生效 |
| 测试 | `python -m pytest -q` | `main.yml`；`pyproject.toml` 设 `testpaths=["tests"]`、`pythonpath=["."]`、`addopts="-q"` |
| 构建 | 无 | 解释型语言，CI 只安装并测试 |
| 冒烟 | `python scripts/smoke_http.py --base-url http://127.0.0.1:8000` | `scripts/smoke_http.py`；需先起服务与已 seed 的库 |

端口来源变量：`_env_int("APP_PORT", _env_int("PORT", 8000))`（`app/config.py:209`），默认 8000；`.env.example` 写 `PORT=8000`。

## 目录结构与分层

```text
app/main.py            应用工厂、CORS、TraceId、审计中间件、路由挂载、__main__ 入口
app/config.py          Settings：环境变量、驱动归一化、URL 组装
app/db.py              SQLAlchemy engine / session
app/envelope.py        响应包体
app/errors.py          错误码与异常处理器
app/middleware.py      审计中间件
app/models/            共享 schema 的 ORM 模型
app/policies/          编码形状、权限形状、有效权限、树索引
app/schemas/           请求与响应模型
app/routers/           auth、users、roles、groups、permissions、operation_logs
app/security/          JWT、刷新 cookie、锁定、密码、授权依赖
app/services/          业务逻辑与守卫、菜单树、查询工具
tests/                 pytest 用例与 conftest
scripts/               smoke_http.py、smoke_pg.py
```

## 配置入口

复制 `.env.example` 为 `.env`（`app/config.py` 用 `load_dotenv(".env")` 读入，真实环境变量优先）。连接优先级为 `DATABASE_URL` → `DB_DRIVER` + `DB_*` → PostgreSQL 默认值；`DATABASE_URL` 支持其他端口的短写 scheme 并自动补全 SQLAlchemy 方言。完整变量清单与跨栈对照见 [docs/backend/configuration.md](../../docs/backend/configuration.md)。

## 本栈偏差

1. 唯一默认暴露 OpenAPI UI 的后端：`FastAPI()` 未覆盖 `docs_url`，`/docs` 与 `/openapi.json` 可用（`app/main.py:61`）；Spring 有 springdoc 但默认关闭，其余四栈没有 UI。
2. 唯一没有构建步骤的栈：CI 仅 `pip install -r requirements-dev.txt` 加 `python -m pytest -q`。
3. 校验失败返回 `40002`、畸形 JSON 返回 `40001`（`app/errors.py:19`、`:20`），与 Java 基准把 bean validation 失败记为 `40001` 的口径不同。
4. 审计保留清理是进程内 asyncio 任务：启动后延迟 60 秒首跑，之后每日一次（`app/main.py` 的 `_retention_loop`）；C# 为每 6 小时。
5. 测试全部走内存 SQLite（`tests/conftest.py` 用 `sqlite+pysqlite:///:memory:` 加 `StaticPool`），不需要数据库服务；其余端口的数据库行为靠真实库脚本（Go、Nest、Rust）或 Docker 集成测试（Spring）。

## 规模与测试

| 指标 | 数值 |
| --- | --- |
| 受版本控制的文件 | 63 |
| Python 文件 | 57 |
| 测试文件 | 10 个 `test_*.py`，另 `conftest.py` |

统计口径：`git ls-files backend/python-fastapi`。端点、方言与验证结论见 [docs/reference/api.md](../../docs/reference/api.md)、[docs/reference/db-dialects.md](../../docs/reference/db-dialects.md)、[docs/reference/stacks.md](../../docs/reference/stacks.md)。

> Last verified: 24826bb · 2026-11-07
> 事实来源: `requirements.txt`、`requirements-dev.txt`、`pyproject.toml`、`.env.example`、`app/config.py`、`app/main.py`、`app/errors.py`、`tests/conftest.py`、`.github/workflows/main.yml`
