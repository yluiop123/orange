#!/usr/bin/env node
/**
 * Copies the canonical permission catalog to the frontends that consume it.
 *
 * The single source of truth is `database/permissions.json`. React and Vue
 * bundle their own copy because they import it from `@/config/permissions.json`
 * (mocks and localized menu titles). The copies are committed so a plain
 * `pnpm build` works without running this script first.
 *
 * Usage:
 *   node scripts/sync-permission-catalog.mjs
 *   node scripts/sync-permission-catalog.mjs --check
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "database/permissions.json");
const targets = [
  "frontend/react/src/config/permissions.json",
  "frontend/vue/src/config/permissions.json",
];

const catalog = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const rendered = `${JSON.stringify(catalog, null, 2)}\n`;
const check = process.argv.includes("--check");
let failed = false;

for (const relative of targets) {
  const target = path.join(root, relative);
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
  if (current === rendered) continue;

  if (check) {
    console.error(`${relative} is out of date; run \`pnpm run permissions:sync\``);
    failed = true;
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, rendered, "utf8");
    console.log(`updated ${relative}`);
  }
}

if (check) {
  if (failed) process.exit(1);
  console.log("permission catalog copies are up to date");
}
