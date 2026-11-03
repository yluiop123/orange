import { randomInt } from 'node:crypto';
import * as bcrypt from 'bcrypt';

/** Same ambiguous-character-free alphabet as the Java backend. */
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const TEMP_PASSWORD_LENGTH = 12;
const BCRYPT_ROUNDS = 10;
const BCRYPT_PREFIX = '{bcrypt}';

export function generateTempPassword(): string {
  let password = '';
  for (let index = 0; index < TEMP_PASSWORD_LENGTH; index += 1) {
    password += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
  }
  return password;
}

/**
 * Hashes with BCrypt and keeps the Spring `DelegatingPasswordEncoder` prefix so
 * the seeded demo users keep working and the Java backend can read our hashes.
 */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS).then((hash) => `${BCRYPT_PREFIX}${hash}`);
}

export function verifyPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) {
    return Promise.resolve(false);
  }
  const normalized = hash.startsWith(BCRYPT_PREFIX) ? hash.slice(BCRYPT_PREFIX.length) : hash;
  return bcrypt.compare(plain, normalized);
}
