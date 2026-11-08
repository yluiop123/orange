#!/usr/bin/env node
/**
 * Read-only consistency check for the committed configuration templates.
 *
 * Configuration lives with each stack:
 *   - frontend/<app>/...            (React `.env`, Vue `.env`, Angular environments)
 *   - backend/<stack>/.env.example  (plus Spring's application-local.example.yaml)
 *
 * This script does not generate anything. It fails when the JWT configuration,
 * the shared API base, or a frontend's frozen OpenAPI copy drifts.
 *
 * Usage: node scripts/check-config.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DEV_JWT_SECRET = "orange-dev-secret-change-me-in-production";
const EXPECTED = {
  JWT_SECRET: DEV_JWT_SECRET,
  JWT_ISSUER: "orange",
  JWT_ACCESS_EXPIRE: "900",
  JWT_REFRESH_EXPIRE: "604800",
};

const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  const absolute = path.join(root, relativePath);
  if (!fs.existsSync(absolute)) {
    fail(`missing file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolute, "utf8");
}

function parseDotenv(relativePath) {
  const values = {};
  for (const rawLine of read(relativePath).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    values[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return values;
}

const BACKENDS = [
  "backend/go-gin-gorm/.env.example",
  "backend/node-nestjs/.env.example",
  "backend/python-fastapi/.env.example",
  "backend/rust-axum/.env.example",
  "backend/csharp/.env.example",
];

for (const file of BACKENDS) {
  const env = parseDotenv(file);
  for (const [key, expected] of Object.entries(EXPECTED)) {
    if (env[key] !== expected) {
      fail(`${file}: ${key} is ${JSON.stringify(env[key])}, expected ${JSON.stringify(expected)}`);
    }
  }
  for (const legacy of ["ACCESS_TOKEN_EXPIRE_SECONDS", "REFRESH_TOKEN_EXPIRE_SECONDS", "ACCESS_TOKEN_SECONDS"]) {
    if (legacy in env) {
      fail(`${file}: legacy variable ${legacy} must not appear in the template`);
    }
  }
}

// Spring Boot uses RSA keys instead of JWT_SECRET.
const spring = read("backend/springboot/src/main/resources/application-local.example.yaml");
for (const [pattern, expected] of [
  [/^\s*issuer:\s*(\S+)/m, "orange"],
  [/^\s*access-expire:\s*(\S+)/m, "900"],
  [/^\s*refresh-expire:\s*(\S+)/m, "604800"],
]) {
  const match = spring.match(pattern);
  if (!match || match[1] !== expected) {
    fail(
      `backend/springboot/src/main/resources/application-local.example.yaml: expected ${expected}, got ${match?.[1] ?? "missing"}`,
    );
  }
}

// Frontend: every app must point at the same API prefix.
const FRONTENDS = [
  ["frontend/react/.env", /^VITE_BASE_API=(.+)$/m],
  ["frontend/vue/.env", /^VITE_API_BASE=(.+)$/m],
  ["frontend/angular/src/environments/environment.ts", /apiBase:\s*['"]([^'"]+)['"]/],
  ["frontend/angular/src/environments/environment.development.ts", /apiBase:\s*['"]([^'"]+)['"]/],
  ["frontend/angular/src/environments/environment.local.ts", /apiBase:\s*['"]([^'"]+)['"]/],
];

for (const [file, pattern] of FRONTENDS) {
  const match = read(file).match(pattern);
  const normalized = match?.[1]?.replace(/\/+$/, "");
  if (normalized !== "/api/v1") {
    fail(`${file}: API base is ${JSON.stringify(match?.[1])}, expected "/api/v1"`);
  }
}

// Frontend Swagger is a frozen snapshot: each app serves its own public copy.
const openapiSnapshot = read("frontend/openapi.json");
for (const app of ["react", "vue", "angular"]) {
  const copy = read(`frontend/${app}/public/openapi.json`);
  if (copy !== openapiSnapshot) {
    fail(
      `frontend/${app}/public/openapi.json must match frontend/openapi.json; copy the snapshot into the app's public directory`,
    );
  }
  read(`frontend/${app}/public/swagger.html`);
}

if (failures.length > 0) {
  console.error("Configuration check failed:");
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`Configuration check passed (${BACKENDS.length} backends + Spring + 3 frontends).`);
