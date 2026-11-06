> English | [简体中文](./README.zh-CN.md)

# Documentation

This directory holds **technology-agnostic project documentation**: the product,
the contracts, the shared data model and the project-wide engineering record.
Nothing here depends on a particular frontend framework or backend language.

## Where a document belongs

| Location | Scope |
| --- | --- |
| `docs/` (here) | Product, API contract, database design, stack matrix, verification, ADRs, security |
| `frontend/docs/` | Frontend design: startup, configuration, architecture, visual language |
| `backend/docs/` | Backend design: startup, configuration, architecture, shared behaviour |
| `frontend/<stack>/README.md` | Command reference for one frontend |
| `backend/<stack>/README.md` | Command reference for one backend |

Rule of thumb: if the document would still be true after replacing React, Vue,
Angular, Spring Boot or FastAPI, it belongs in this directory.

## Product and architecture

| Document | Content |
| --- | --- |
| [FEATURES.md](./FEATURES.md) | Product scope, roles, permission model, page inventory |
| [STACKS.md](./STACKS.md) | Stack matrix, ports, start commands |
| [DB-MATRIX.md](./DB-MATRIX.md) | Backend × database test matrix |
| [PORTING.md](./PORTING.md) | Checklist for adding or porting a stack |
| [../CONTEXT.md](../CONTEXT.md) | Domain vocabulary |
| [../PROJECT_ISSUES.md](../PROJECT_ISSUES.md) | Decisions and accepted trade-offs |

## Contracts and data

| Document | Content |
| --- | --- |
| [API.md](./API.md) | HTTP contract: endpoints, auth, errors, pagination |
| [DATABASE.md](./DATABASE.md) | ER model, invariants, dialect matrix |
| [validation-rules.md](./validation-rules.md) | Validation layering across API, DTOs and database |
| [../contracts/openapi.json](../contracts/openapi.json) | Machine-readable contract |
| `../database/<engine>/ddl.sql` | Canonical schema per engine |
| `../database/<engine>/dml.sql` | Canonical seed data per engine |

## Engineering record

| Document | Content |
| --- | --- |
| [VERIFICATION.md](./VERIFICATION.md) | What was actually executed, and what is only static review |
| [adr/](./adr/) | Architecture decision records |
| [audits/](./audits/) | Audits |
| [security/](./security/) | Security notes, JWT keys |

## Code documentation

| Entry point | Content |
| --- | --- |
| [../frontend/docs/README.md](../frontend/docs/README.md) | Frontend startup, configuration, architecture and visual guide |
| [../backend/docs/README.md](../backend/docs/README.md) | Backend startup, configuration and shared architecture |
| [../config/README.md](../config/README.md) | Single-source configuration and generated files |

## Agent instructions

| Document | Content |
| --- | --- |
| [../AGENTS.md](../AGENTS.md) | Agent entry point |
| [agents/domain.md](./agents/domain.md) | Domain documentation rules |
| [agents/issue-tracker.md](./agents/issue-tracker.md) | Issue tracker conventions |
| [agents/triage-labels.md](./agents/triage-labels.md) | Triage labels |
