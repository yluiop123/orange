/**
 * Runs the full contract acceptance test against one or more backends on SQLite.
 *
 * Usage: node scripts/ci/run-contract.mjs [stack ...]
 *
 * Stacks: spring go nest csharp rust fastapi (default: all).
 * The stack must already be built (see .github/workflows/main.yml or the
 * backend README). Each run gets a fresh SQLite database in the OS temp dir.
 */
import { spawn, spawnSync } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const port = Number(process.env.CONTRACT_PORT ?? 18080);
const base = `http://127.0.0.1:${port}/api/v1`;
const python = process.env.PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3');
const stacks = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['spring', 'go', 'nest', 'csharp', 'rust', 'fastapi'];

// Every stack runs with the same RSA pair, so the acceptance run also proves
// the shared RS256 path instead of the HS256 development fallback.
const keyDir = path.join(root, 'keys');
const jwtPrivateKey = path.join(keyDir, 'jwt-private.pem');
const jwtPublicKey = path.join(keyDir, 'jwt-public.pem');

function ensureKeys() {
  if (fs.existsSync(jwtPrivateKey) && fs.existsSync(jwtPublicKey)) return;
  fs.mkdirSync(keyDir, { recursive: true });
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  fs.writeFileSync(jwtPrivateKey, privateKey, { mode: 0o600 });
  fs.writeFileSync(jwtPublicKey, publicKey, { mode: 0o644 });
  console.log(`Generated a throwaway RS256 key pair in ${keyDir}`);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with ${result.status}`);
  }
}

function prepareDatabase(stack) {
  const file = path.join(os.tmpdir(), `orange-contract-${stack}.db`);
  if (fs.existsSync(file)) fs.rmSync(file);
  run(python, [
    '-c',
    'import sqlite3,sys,pathlib; c=sqlite3.connect(sys.argv[1]); c.executescript(pathlib.Path(sys.argv[2]).read_text(encoding="utf-8")); c.executescript(pathlib.Path(sys.argv[3]).read_text(encoding="utf-8")); c.close()',
    file,
    'database/sqlite/ddl.sql',
    'database/sqlite/dml.sql',
  ]);
  return file;
}

function startCommand(stack, dbFile) {
  const jdbc = `jdbc:sqlite:${dbFile}`;
  const env = {
    ...process.env,
    APP_PORT: String(port),
    DB_DRIVER: 'sqlite',
    DATABASE_URL: dbFile,
    DB_FILE: dbFile,
    DB_PATH: dbFile,
    SPRING_DATASOURCE_URL: jdbc,
    JWT_PRIVATE_KEY: jwtPrivateKey,
    JWT_PUBLIC_KEY: jwtPublicKey,
  };
  switch (stack) {
    case 'spring': {
      const target = path.join(root, 'backend/springboot/target');
      const jar = fs.readdirSync(target).find((file) => file.endsWith('.jar') && !file.endsWith('.original'));
      if (!jar) throw new Error('Spring Boot jar not found; run mvn package first');
      const java = process.env.JAVA_HOME
        ? path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
        : 'java';
      return {
        command: java,
        args: ['-jar', path.join(target, jar)],
        cwd: path.join(root, 'backend/springboot'),
        env,
      };
    }
    case 'go': {
      const exe = process.platform === 'win32' ? 'server.exe' : 'server';
      return { command: path.join(root, 'backend/go-gin-gorm/bin', exe), args: [], cwd: path.join(root, 'backend/go-gin-gorm'), env };
    }
    case 'nest':
      return { command: 'node', args: ['dist/main.js'], cwd: path.join(root, 'backend/node-nestjs'), env };
    case 'csharp':
      return { command: 'dotnet', args: ['out/Orange.Api.dll'], cwd: path.join(root, 'backend/csharp'), env };
    case 'rust': {
      const exe = process.platform === 'win32' ? 'orange-rust-axum.exe' : 'orange-rust-axum';
      return { command: path.join(root, 'backend/rust-axum/target/debug', exe), args: [], cwd: path.join(root, 'backend/rust-axum'), env };
    }
    case 'fastapi': {
      const venv = process.platform === 'win32'
        ? path.join(root, 'backend/python-fastapi/.venv/Scripts/python.exe')
        : path.join(root, 'backend/python-fastapi/.venv/bin/python');
      const command = fs.existsSync(venv) ? venv : python;
      return {
        command,
        args: ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', String(port)],
        cwd: path.join(root, 'backend/python-fastapi'),
        env,
      };
    }
    default:
      throw new Error(`unknown stack ${stack}`);
  }
}

async function stop(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

const failures = [];

// Reuse an existing pair so repeated runs keep the same keys.
ensureKeys();

for (const stack of stacks) {
  console.log(`\n=== contract: ${stack} ===`);
  let child = null;
  try {
    const dbFile = prepareDatabase(stack);
    const start = startCommand(stack, dbFile);
    const log = path.join(os.tmpdir(), `orange-contract-${stack}.log`);
    const out = fs.openSync(log, 'w');
    child = spawn(start.command, start.args, {
      cwd: start.cwd,
      env: start.env,
      stdio: ['ignore', out, out],
    });
    const result = spawnSync('node', ['scripts/ci/contract-test.mjs', base], { cwd: root, stdio: 'inherit' });
    if (result.status !== 0) {
      failures.push(`${stack}: contract test failed (see ${log})`);
    }
  } catch (error) {
    failures.push(`${stack}: ${error.message}`);
    console.error(`FAILED ${stack}: ${error.message}`);
  } finally {
    await stop(child);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

if (failures.length) {
  console.error(`\n${failures.length} stack(s) failed:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`\nAll ${stacks.length} stack(s) passed the contract test.`);
