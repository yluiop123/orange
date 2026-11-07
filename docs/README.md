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

## Reading paths

### New to the project

1. [../README.md](../README.md) — what the project is and the quick start.
2. [FEATURES.md](./FEATURES.md) — product scope, roles and page inventory.
3. [STACKS.md](./STACKS.md) — ports and run commands for every stack.
4. [../frontend/docs/GETTING-STARTED.md](../frontend/docs/GETTING-STARTED.md) and
   [../backend/docs/GETTING-STARTED.md](../backend/docs/GETTING-STARTED.md).
5. [DATABASE.md](./DATABASE.md) — schema, seed and dialect matrix.
6. [VERIFICATION.md](./VERIFICATION.md) — what was actually executed.

### Frontend work

1. [../frontend/docs/README.md](../frontend/docs/README.md) — frontend overview.
2. [../frontend/docs/CONFIGURATION.md](../frontend/docs/CONFIGURATION.md) — env
   files and mock/real switch.
3. [../frontend/docs/ARCHITECTURE.md](../frontend/docs/ARCHITECTURE.md) — shared
   frontend structure.
4. [../frontend/docs/STYLE-GUIDE.md](../frontend/docs/STYLE-GUIDE.md) — visual
   language and tokens.
5. `frontend/<stack>/README.md` — commands for React, Vue or Angular.

### Backend / API work

1. [../backend/docs/README.md](../backend/docs/README.md) — backend overview.
2. [API.md](./API.md) — HTTP contract: endpoints, auth, errors, pagination.
3. [DATABASE.md](./DATABASE.md) — ER model, invariants, dialect matrix.
4. [../backend/docs/CONFIGURATION.md](../backend/docs/CONFIGURATION.md) — per-stack
   env files and database switching.
5. [../backend/docs/ARCHITECTURE.md](../backend/docs/ARCHITECTURE.md) — shared
   backend behaviour.
6. [validation-rules.md](./validation-rules.md) — validation layering.
7. `backend/<stack>/README.md` — commands and stack-specific notes.

### Agent work

1. [../AGENTS.md](../AGENTS.md) — agent entry point.
2. [agents/issue-tracker.md](./agents/issue-tracker.md) — issue and spec files.
3. [agents/triage-labels.md](./agents/triage-labels.md) — triage vocabulary.
4. [agents/domain.md](./agents/domain.md) — domain documentation rules.
5. [../CONTEXT.md](../CONTEXT.md) — domain vocabulary.
6. [adr/](./adr/) — architecture decision records.

## Current documents

### Product and architecture

| Document | Content |
| --- | --- |
| [FEATURES.md](./FEATURES.md) | Product scope, roles, permission model, page inventory |
| [STACKS.md](./STACKS.md) | Stack matrix, ports, start commands |
| [DB-MATRIX.md](./DB-MATRIX.md) | Backend × database test matrix |
| [PORTING.md](./PORTING.md) | Checklist for adding or porting a stack |

### Contracts and data

| Document | Content |
| --- | --- |
| [API.md](./API.md) | HTTP contract and behaviour |
| [../contracts/openapi.json](../contracts/openapi.json) | Machine-readable API contract |
| [DATABASE.md](./DATABASE.md) | ER model, invariants, dialect matrix |
| [validation-rules.md](./validation-rules.md) | Validation layering across API, DTOs and database |
| `../database/<engine>/ddl.sql` | Canonical schema per engine |
| `../database/<engine>/dml.sql` | Canonical seed data per engine |
| `../database/<engine>/README.md` | Engine-specific notes |

### Engineering record

| Document | Content |
| --- | --- |
| [VERIFICATION.md](./VERIFICATION.md) | What was actually executed, and what is only static review |
| [adr/](./adr/) | Architecture decision records |
| [security/](./security/) | Security notes and JWT keys |

### Code documentation

| Entry point | Content |
| --- | --- |
| [../frontend/docs/README.md](../frontend/docs/README.md) | Frontend startup, configuration, architecture and visual guide |
| [../backend/docs/README.md](../backend/docs/README.md) | Backend startup, configuration and shared architecture |

## Archive

Historical snapshots live outside the main documentation tree:

| Path | Content |
| --- | --- |
| [../.scratch/archive/PROJECT_ISSUES.md](../.scratch/archive/PROJECT_ISSUES.md) | Decisions, accepted trade-offs and the 2026-11 verification log |
| [../.scratch/archive/audits/system-management-2026-11-01.md](../.scratch/archive/audits/system-management-2026-11-01.md) | Historical system-management audit |
| [../.scratch/archive/CHANGELOG.md](../.scratch/archive/CHANGELOG.md) | Historical changelog |
| [../.scratch/archive/zh/](../.scratch/archive/zh/) | Archived Chinese translations |

## Language policy

English is the primary language for deep documentation. Chinese is maintained
for the root README and for the frontend/backend `GETTING-STARTED` and
`CONFIGURATION` guides. Archived translations may lag behind the current code.
