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

/**
 * True for any integrity violation that the API reports as `40901`: unique /
 * primary key, foreign key and not-null failures. PostgreSQL uses SQLSTATEs,
 * MySQL/MariaDB use errnos, and better-sqlite3 uses extended result codes.
 */
export function isConstraintViolation(error: unknown): boolean {
  if (isUniqueViolation(error)) {
    return true;
  }
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { driverError?: unknown; message?: unknown };
  const driverError = (candidate.driverError ?? candidate) as {
    code?: unknown;
    errno?: unknown;
    message?: unknown;
  };

  const code = typeof driverError.code === 'string' ? driverError.code : undefined;
  const errno = typeof driverError.errno === 'number' ? driverError.errno : undefined;
  if (
    code === '23503' ||
    code === '23502' ||
    code === 'ER_NO_REFERENCED_ROW_2' ||
    code === 'ER_ROW_IS_REFERENCED_2' ||
    code === 'ER_BAD_NULL_ERROR' ||
    code === 'SQLITE_CONSTRAINT_FOREIGNKEY' ||
    code === 'SQLITE_CONSTRAINT_NOTNULL'
  ) {
    return true;
  }
  if (errno === 1048 || errno === 1451 || errno === 1452) {
    return true;
  }

  const message = typeof driverError.message === 'string' ? driverError.message : '';
  return (
    message.includes('FOREIGN KEY constraint failed') ||
    message.includes('NOT NULL constraint failed') ||
    message.includes('Cannot add or update a child row') ||
    message.includes('Cannot delete or update a parent row')
  );
}
