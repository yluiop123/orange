# Orange

Orange is a permission-management admin product — users, groups, roles and a
permission-driven menu tree — implemented **nine times**: three frontends and
six backends sharing one contract and one database model.

The point is not the product. The point is a **reference baseline for comparing
stacks**: every implementation must serve the same HTTP contract, the same
schema and the same behaviour, so differences between frameworks are isolated
from differences between designs.

## Repository layout

```text
frontend/          three UI implementations + shared frontend docs
backend/           six API implementations + shared backend docs
database/          canonical DDL and seed data, one directory per engine
contracts/         openapi.json — the machine-readable contract
docs/              technology-agnostic documentation (Chinese)
scripts/           cross-stack checks, database matrix, E2E helpers
.scratch/          issue tracker and archive (internal, not documentation)
```

Boundary rule: `contracts/`, `database/` and `docs/` describe the product and
must stay true after swapping React, Vue, Angular, Spring Boot, Go, NestJS,
.NET, Rust or FastAPI.

## Stacks

| Layer | Reference | Other implementations |
| --- | --- | --- |
| Frontend | React 19 + Vite + shadcn/Base UI (deployed to GitHub Pages) | Vue 3 + Vuetify, Angular 21 + Material |
| Backend | Java 25 + Spring Boot (behaviour reference) | Go + Gin + GORM, NestJS, ASP.NET Core (.NET 10), Rust + Axum, Python + FastAPI |
| Database | PostgreSQL | MySQL, MariaDB, SQLite (tested); openGauss, OceanBase, GoldenDB (static SQL) |

Ports, commands, dependency notes and per-stack database support live in one
place: [`docs/reference/stacks.md`](./docs/reference/stacks.md).

## Quick start

```bash
# frontend (mock mode, no backend needed)
cd frontend/react && pnpm install && pnpm dev

# backend + database (FastAPI + SQLite example)
cd backend/python-fastapi
pip install -r requirements-dev.txt
sqlite3 app.db < ../../database/sqlite/ddl.sql
sqlite3 app.db < ../../database/sqlite/dml.sql
python -m app.main
```

Then sign in with the seed account and explore the menu tree. The full walkthrough
is [`docs/tutorials/quickstart.md`](./docs/tutorials/quickstart.md).

## Documentation

Deep documentation is written in **Chinese**; this README is the English entry
point. Start at [`docs/index.md`](./docs/index.md), which maps every document to
one of four Diátaxis roles and gives reading paths for newcomers, single-stack
users and maintainers.

- **Tutorials** — run a stack, make a first contribution
- **How-to** — add a stack, change the contract, run the database matrix, port a page
- **Reference** — stack matrix, HTTP contract, data model, dialects, permission fields, configuration, scripts
- **Explanation** — architecture, permission model, validation layering, auth lifecycle, porting trade-offs

Architecture decisions are recorded in [`docs/adr/`](./docs/adr/). Domain
vocabulary is fixed in [`CONTEXT.md`](./CONTEXT.md); AI agents enter through
[`AGENTS.md`](./AGENTS.md).

## Verification

CI runs three categories of checks on every push and pull request:

- **Configuration** — `scripts/check-config.mjs` and `npm run permissions:check`
- **Per-stack** — lint, type-check, tests and production build for all nine stacks
- **Contract and matrix** — on `main`, each backend is exercised against
  PostgreSQL, MySQL, MariaDB and SQLite, then checked against `contracts/openapi.json`

Only the React frontend is deployed to GitHub Pages.

## Contributing

Read [`docs/index.md`](./docs/index.md) → "维护者" path, then
[`docs/how-to/verify-a-change.md`](./docs/how-to/verify-a-change.md) for the
checks to run before opening a pull request. Issues and specs live as Markdown
files under [`.scratch/`](./.scratch/).

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md).

## License

See [`LICENSE`](./LICENSE).
