/**
 * True when `error` is a unique/primary-key violation from any supported
 * driver. PostgreSQL reports SQLSTATE `23505`; MySQL and MariaDB report errno
 * `1062` (driver code `ER_DUP_ENTRY`); better-sqlite3 reports the
 * `SQLITE_CONSTRAINT_*` extended codes.
 */
export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    errno?: unknown;
    driverError?: unknown;
    message?: unknown;
  };
  const driverError = (candidate.driverError ?? candidate) as {
    code?: unknown;
    errno?: unknown;
    message?: unknown;
  };

  const code = typeof driverError.code === 'string' ? driverError.code : undefined;
  const errno = typeof driverError.errno === 'number' ? driverError.errno : undefined;

  if (
    code === '23505' ||
    code === 'ER_DUP_ENTRY' ||
    code === 'SQLITE_CONSTRAINT_UNIQUE' ||
    code === 'SQLITE_CONSTRAINT_PRIMARYKEY'
  ) {
    return true;
  }
  if (errno === 1062) {
    return true;
  }

  const message = typeof driverError.message === 'string' ? driverError.message : '';
  return message.includes('UNIQUE constraint failed') || message.includes('Duplicate entry');
}
