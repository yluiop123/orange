#!/usr/bin/env node
/**
 * Checks every relative Markdown link in the repository resolves to a file.
 *
 * - Skips node_modules, .venv, dist, build, target, bin, obj and .git.
 * - Skips external links (http/https/mailto) and pure anchors.
 * - Verifies the file part of `path#anchor`; anchors are not resolved.
 *
 * Usage: node scripts/check-docs-links.mjs [--quiet]
 * Exit code 1 when a broken link is found.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set([
  'node_modules', '.venv', 'dist', 'build', 'target', 'bin', 'obj', '.git',
  '.angular', '.pytest_cache', '__pycache__', '.playwright-mcp',
  // Internal issue tracker + historical archive; its snapshots intentionally
  // keep links to the documentation tree as it was when archived.
  '.scratch',
]);
const quiet = process.argv.includes('--quiet');

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

const LINK = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const broken = [];
const files = walk(ROOT);
let checked = 0;

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(LINK)) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith('#') || /^(https?:|mailto:|tel:|data:)/i.test(raw)) continue;
    if (raw.startsWith('<') && raw.endsWith('>')) continue; // autolink
    const target = raw.replace(/^<|>$/g, '').split('#')[0].split('?')[0];
    if (!target) continue;
    const absolute = resolve(dirname(file), decodeURI(target));
    checked += 1;
    // Directories are valid targets (GitHub renders directory listings).
    if (!existsSync(absolute)) {
      broken.push({
        file: relative(ROOT, file).replace(/\\/g, '/'),
        line: text.slice(0, match.index).split('\n').length,
        target: raw,
      });
    }
  }
}

if (broken.length === 0) {
  if (!quiet) console.log(`OK: ${checked} relative links in ${files.length} Markdown files resolve.`);
  process.exit(0);
}

for (const item of broken) {
  console.error(`${item.file}:${item.line}  ->  ${item.target}`);
}
console.error(`\n${broken.length} broken link(s) out of ${checked} checked (${files.length} files).`);
process.exit(1);
