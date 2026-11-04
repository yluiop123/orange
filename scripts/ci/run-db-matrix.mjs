/**
 * Runs one backend against PostgreSQL, MySQL, MariaDB and SQLite.
 *
 * Usage: node scripts/ci/run-db-matrix.mjs <stack> [engines...]
 *
 * The stack must already be built (see .github/workflows/main.yml). Databases
 * are reset and seeded before each engine, then the generic HTTP smoke test is
 * executed against the running server.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const stack = process.argv[2];
const engines = process.argv.slice(3).length
  ? process.argv.slice(3)
  : ['postgres', 'mysql', 'mariadb', 'sqlite'];

if (!stack) {
  console.error('usage: node scripts/ci/run-db-matrix.mjs <stack> [engines...]');
  process.exit(2);
}

const sqliteFile = path.join(root, `orange-ci-${stack}.db`);

const jdbc = {
  postgres: 'jdbc:postgresql://127.0.0.1:5432/orange',
  mysql: 'jdbc:mysql://127.0.0.1:3306/orange',
  mariadb: 'jdbc:mysql://127.0.0.1:3307/orange',
  sqlite: `jdbc:sqlite:${sqliteFile}`,
};

const url = {
  postgres: 'postgres://postgres:postgres@127.0.0.1:5432/orange',
  mysql: 'mysql://root:root@127.0.0.1:3306/orange',
  mariadb: 'mariadb://root:root@127.0.0.1:3307/orange',
  sqlite: sqliteFile,
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with ${result.status}`);
  }
}

function loadPostgres() {
  const env = { ...process.env, PGPASSWORD: 'postgres' };
  run('psql', ['-h', '127.0.0.1', '-U', 'postgres', '-d', 'postgres', '-c', 'DROP DATABASE IF EXISTS orange'], { env });
  run('psql', ['-h', '127.0.0.1', '-U', 'postgres', '-d', 'postgres', '-c', 'CREATE DATABASE orange'], { env });
  for (const file of ['database/postgres/ddl.sql', 'database/postgres/dml.sql']) {
    run('psql', ['-h', '127.0.0.1', '-U', 'postgres', '-d', 'orange', '-v', 'ON_ERROR_STOP=1', '-f', file], { env });
  }
}

function loadMySql(port, directory) {
  const env = { ...process.env, MYSQL_PWD: 'root' };
  run('mysql', ['-h', '127.0.0.1', '-P', String(port), '-uroot', '-e', 'DROP DATABASE IF EXISTS orange; CREATE DATABASE orange'], { env });
  for (const file of [`database/${directory}/ddl.sql`, `database/${directory}/dml.sql`]) {
    const sql = fs.readFileSync(path.join(root, file), 'utf8');
    run('mysql', ['-h', '127.0.0.1', '-P', String(port), '-uroot', 'orange', '-e', sql], { env });
  }
}

function loadSqlite() {
  if (fs.existsSync(sqliteFile)) fs.rmSync(sqliteFile);
  run('python3', [
    '-c',
    'import sqlite3,sys,pathlib; c=sqlite3.connect(sys.argv[1]); c.executescript(pathlib.Path(sys.argv[2]).read_text(encoding="utf-8")); c.executescript(pathlib.Path(sys.argv[3]).read_text(encoding="utf-8")); c.close()',
    sqliteFile,
    'database/sqlite/ddl.sql',
    'database/sqlite/dml.sql',
  ]);
}

function resetDatabase(engine) {
  if (engine === 'postgres') loadPostgres();
  else if (engine === 'mysql') loadMySql(3306, 'mysql');
  else if (engine === 'mariadb') loadMySql(3307, 'mariadb');
  else if (engine === 'sqlite') loadSqlite();
  else throw new Error(`unknown engine ${engine}`);
}

function startCommand() {
  switch (stack) {
    case 'spring': {
      const target = path.join(root, 'backend/springboot/target');
      const jar = fs.readdirSync(target).find((file) => file.endsWith('.jar') && !file.endsWith('.original'));
      if (!jar) throw new Error('Spring Boot jar not found; run mvn package first');
      return { command: 'java', args: ['-jar', path.join(target, jar)], cwd: path.join(root, 'backend/springboot') };
    }
    case 'go':
      return { command: path.join(root, 'backend/go-gin-gorm/bin/server'), args: [], cwd: path.join(root, 'backend/go-gin-gorm') };
    case 'nest':
      return { command: 'node', args: ['dist/main.js'], cwd: path.join(root, 'backend/node-nestjs') };
    case 'csharp':
      return { command: 'dotnet', args: ['out/Orange.Api.dll'], cwd: path.join(root, 'backend/csharp') };
    case 'rust':
      return { command: path.join(root, 'backend/rust-axum/target/debug/orange-rust-axum'), args: [], cwd: path.join(root, 'backend/rust-axum') };
    case 'fastapi':
      return { command: 'python3', args: ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8080'], cwd: path.join(root, 'backend/python-fastapi') };
    default:
      throw new Error(`unknown stack ${stack}`);
  }
}

async function stop(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGTERM');
  await new Promise((resolve) => setTimeout(resolve, 5000));
  if (child.exitCode === null) child.kill('SIGKILL');
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

const failures = [];

for (const engine of engines) {
  console.log(`\n=== ${stack} / ${engine} ===`);
  try {
    resetDatabase(engine);
    const start = startCommand();
    const env = {
      ...process.env,
      APP_PORT: '8080',
      DB_DRIVER: engine,
      DATABASE_URL: url[engine],
      DB_FILE: sqliteFile,
      DB_PATH: sqliteFile,
      SPRING_DATASOURCE_URL: jdbc[engine],
    };
    const server = spawn(start.command, start.args, { cwd: start.cwd, env, stdio: ['ignore', 'inherit', 'inherit'] });
    try {
      run('node', ['scripts/ci/http-smoke.mjs', 'http://127.0.0.1:8080/api/v1'], { cwd: root });
    } finally {
      await stop(server);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  } catch (error) {
    failures.push(`${engine}: ${error.message}`);
    console.error(`FAILED ${stack}/${engine}: ${error.message}`);
  }
}

if (failures.length) {
  console.error(`\n${failures.length} engine(s) failed:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`\n${stack}: all ${engines.length} engine(s) passed`);
