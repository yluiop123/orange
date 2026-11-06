> [English](./README.md) | 简体中文

# 文档

本目录存放**与技术栈无关的项目文档**：产品、契约、共享数据模型和项目级工程记录。
这里的内容不依赖任何具体的前端框架或后端语言。

## 文档应该放在哪里

| 位置 | 范围 |
| --- | --- |
| `docs/`（本目录） | 产品、接口契约、数据库设计、技术栈矩阵、验证记录、ADR、安全 |
| `frontend/docs/` | 前端设计：启动、配置、架构、视觉规范 |
| `backend/docs/` | 后端设计：启动、配置、架构、共享行为 |
| `frontend/<stack>/README.md` | 单个前端的命令参考 |
| `backend/<stack>/README.md` | 单个后端的命令参考 |

判断标准：如果一份文档在把 React、Vue、Angular、Spring Boot 或 FastAPI 换掉之后仍然成立，
它就应该放在本目录。

## 产品与架构

| 文档 | 内容 |
| --- | --- |
| [FEATURES.zh-CN.md](./FEATURES.zh-CN.md) | 产品范围、角色、权限模型、页面清单 |
| [STACKS.zh-CN.md](./STACKS.zh-CN.md) | 技术栈矩阵、端口、启动命令 |
| [DB-MATRIX.md](./DB-MATRIX.md) | 后端 × 数据库测试矩阵 |
| [PORTING.zh-CN.md](./PORTING.zh-CN.md) | 新增或移植技术栈的检查清单 |
| [../CONTEXT.md](../CONTEXT.md) | 领域词汇 |
| [../PROJECT_ISSUES.md](../PROJECT_ISSUES.md) | 决策与已接受的取舍 |

## 契约与数据

| 文档 | 内容 |
| --- | --- |
| [API.zh-CN.md](./API.zh-CN.md) | HTTP 契约：端点、认证、错误、分页 |
| [DATABASE.zh-CN.md](./DATABASE.zh-CN.md) | ER 模型、约束、方言矩阵 |
| [validation-rules.md](./validation-rules.md) | 接口、DTO 与数据库之间的校验分层 |
| [../contracts/openapi.json](../contracts/openapi.json) | 机器可读契约 |
| `../database/<engine>/ddl.sql` | 各引擎的规范表结构 |
| `../database/<engine>/dml.sql` | 各引擎的规范种子数据 |

## 工程记录

| 文档 | 内容 |
| --- | --- |
| [VERIFICATION.zh-CN.md](./VERIFICATION.zh-CN.md) | 实际执行过的验证，以及仅有静态审查的部分 |
| [adr/](./adr/) | 架构决策记录 |
| [audits/](./audits/) | 审计记录 |
| [security/](./security/) | 安全说明、JWT 密钥 |

## 代码文档

| 入口 | 内容 |
| --- | --- |
| [../frontend/docs/README.zh-CN.md](../frontend/docs/README.zh-CN.md) | 前端启动、配置、架构与视觉规范 |
| [../backend/docs/README.zh-CN.md](../backend/docs/README.zh-CN.md) | 后端启动、配置与共享架构 |
| [../config/README.zh-CN.md](../config/README.zh-CN.md) | 配置单一来源与生成文件 |

## Agent 说明

| 文档 | 内容 |
| --- | --- |
| [../AGENTS.md](../AGENTS.md) | Agent 入口 |
| [agents/domain.md](./agents/domain.md) | 领域文档规则 |
| [agents/issue-tracker.md](./agents/issue-tracker.md) | Issue 约定 |
| [agents/triage-labels.md](./agents/triage-labels.md) | Triage 标签 |
