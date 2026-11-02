import { generateKeyPairSync } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const keyDir = resolve(root, "springboot/src/main/resources/keys");
const privateKeyPath = resolve(keyDir, "private_key.pem");
const publicKeyPath = resolve(keyDir, "public_key.pem");
const force = process.argv.includes("--force");

if (existsSync(privateKeyPath) && existsSync(publicKeyPath) && !force) {
  console.log(`JWT keys already exist in ${keyDir}`);
  console.log("Use --force to regenerate them (this invalidates existing tokens).");
  process.exit(0);
}

mkdirSync(keyDir, { recursive: true });
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
writeFileSync(publicKeyPath, publicKey, { mode: 0o644 });
console.log(`Generated JWT keys in ${keyDir}`);
console.log("These files are ignored by Git. Do not commit production keys.");
