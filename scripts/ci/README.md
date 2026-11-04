# CI helpers

Linux-only scripts used by `.github/workflows/main.yml`.

## `http-smoke.mjs`

Runs the same HTTP checks against any backend:

```bash
node scripts/ci/http-smoke.mjs http://127.0.0.1:8080/api/v1
```

It logs in as `super/super`, checks the envelope, `user-info`, menus, the users
list, group create/list/delete, operation logs and logout. It retries login for
up to 90 seconds so it can start right after a server process.

## `run-db-matrix.mjs`

Runs one built backend against PostgreSQL, MySQL, MariaDB and SQLite:

```bash
node scripts/ci/run-db-matrix.mjs go
node scripts/ci/run-db-matrix.mjs fastapi postgres sqlite
```

Requirements:

- PostgreSQL on `127.0.0.1:5432`, MySQL on `3306`, MariaDB on `3307`
  (`postgres`/`root` credentials).
- `psql`, `mysql`, `python3` and Node on `PATH`.
- The stack is already built (see the workflow; the script starts the binary
  from its standard output directory).

Each engine is reset and seeded from `database/<engine>/`, then the server is
started on `APP_PORT=8080` and removed after the smoke run.

## `contract-test.mjs`

Full cross-stack acceptance suite. It mutates data, so point it at a disposable
database:

```bash
node scripts/ci/contract-test.mjs http://127.0.0.1:18080/api/v1
```

It checks the response envelope and `X-Trace-Id` header, login/refresh/logout
rotation, forced password change, all user/role/group/permission CRUD paths,
validation and conflict codes, permission enforcement, sorting/filtering,
operation logs and CORS. One run currently performs 327 assertions.

## `run-contract.mjs`

Starts one or more built stacks on SQLite and runs `contract-test.mjs` against
each fresh database:

```bash
node scripts/ci/run-contract.mjs            # all six stacks
node scripts/ci/run-contract.mjs spring go  # selected stacks
```

The stack binaries must already be built. The script seeds SQLite with
`python3`, starts the server on `CONTRACT_PORT` (default `18080`), runs the
suite, then stops the process. On Windows, set `JAVA_HOME` so the Spring jar runs
with the JDK it was compiled against.
