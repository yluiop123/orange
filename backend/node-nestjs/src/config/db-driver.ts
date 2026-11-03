import './env';

/** Databases the stack can run against. openGauss et al. stay PostgreSQL-compatible. */
export type DbDriver = 'postgres' | 'mysql' | 'mariadb' | 'sqlite';

const DB_DRIVERS: readonly DbDriver[] = ['postgres', 'mysql', 'mariadb', 'sqlite'];

/** Maps a `DATABASE_URL` scheme to a driver, `null` when it is not recognised. */
export function driverFromDatabaseUrl(url: string | undefined): DbDriver | null {
  if (!url) {
    return null;
  }
  const match = /^([a-z0-9+.-]+):/i.exec(url.trim());
  if (!match) {
    return null;
  }
  switch (match[1].toLowerCase()) {
    case 'postgres':
    case 'postgresql':
      return 'postgres';
    case 'mysql':
      return 'mysql';
    case 'mariadb':
      return 'mariadb';
    case 'sqlite':
    case 'sqlite3':
    case 'file':
      return 'sqlite';
    default:
      return null;
  }
}

/**
 * `DB_DRIVER` wins; otherwise the `DATABASE_URL` scheme decides; otherwise the
 * historical PostgreSQL default. Read at call time so the same value drives
 * both the TypeORM connection and the entity column types.
 */
export function resolveDbDriver(): DbDriver {
  const explicit = (process.env.DB_DRIVER ?? '').trim().toLowerCase();
  if (explicit) {
    if (!(DB_DRIVERS as readonly string[]).includes(explicit)) {
      throw new Error(
        `Unsupported DB_DRIVER "${explicit}"; expected one of ${DB_DRIVERS.join(', ')}`,
      );
    }
    return explicit as DbDriver;
  }
  return driverFromDatabaseUrl(process.env.DATABASE_URL) ?? 'postgres';
}
