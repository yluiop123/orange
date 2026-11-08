/**
 * Generates the shared development RSA key pair used by every backend.
 *
 * The six stacks all accept `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` as either an
 * inline PEM value or a file path. When both are configured they sign and
 * verify with RS256; otherwise they fall back to HS256 + JWT_SECRET.
 *
 * Usage:
 *   pnpm run jwt:keys                 # writes keys/ at the repository root
 *   pnpm run jwt:keys -- --force      # rotate the pair (invalidates old tokens)
 *   node scripts/generate-jwt-keys.mjs --out=D:/secrets/orange
 *
 * The output directory is gitignored. Production keys must be generated outside
 * the repository, stored in a secret manager, and mounted into each service.
 */
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const force = args.includes('--force');
const outArg = args.find((arg) => arg.startsWith('--out='));
const outIndex = args.indexOf('--out');
const outDir = resolve(
  root,
  outArg
    ? outArg.slice('--out='.length)
    : outIndex >= 0
      ? (args[outIndex + 1] ?? 'keys')
      : 'keys',
);
const privateKeyPath = resolve(outDir, 'jwt-private.pem');
const publicKeyPath = resolve(outDir, 'jwt-public.pem');

if (existsSync(privateKeyPath) && existsSync(publicKeyPath) && !force) {
  console.log(`JWT keys already exist in ${outDir}`);
  console.log('Use --force to regenerate them (this invalidates existing tokens).');
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
writeFileSync(publicKeyPath, publicKey, { mode: 0o644 });

console.log('Generated JWT RSA key pair (RS256):');
console.log(`  private: ${privateKeyPath}`);
console.log(`  public:  ${publicKeyPath}`);
console.log('');
console.log('Point every backend at the same pair, for example:');
console.log(`  JWT_PRIVATE_KEY=${privateKeyPath}`);
console.log(`  JWT_PUBLIC_KEY=${publicKeyPath}`);
console.log('');
console.log('Both variables also accept inline PEM content. Without them the');
console.log('services fall back to HS256 using JWT_SECRET (development only).');
console.log('The output directory is gitignored; never commit a production key.');
