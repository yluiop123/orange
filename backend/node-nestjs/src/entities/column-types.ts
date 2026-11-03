import { resolveDbDriver } from '../config/db-driver';

/**
 * Portable column type for the schema's `timestamptz` columns.
 *
 * - PostgreSQL keeps `timestamptz`, so the reference behaviour is unchanged.
 * - MySQL and MariaDB use `datetime(6)` (TypeORM appends the microsecond
 *   precision), matching `database/<engine>/ddl.sql`.
 * - SQLite has no date type: the shared DDL declares these columns as `TEXT`
 *   holding ISO-8601 UTC. TypeORM's `datetime` codec writes
 *   `YYYY-MM-DD HH:MM:SS.SSS` (UTC) and hydrates it back as a `Date`, which is
 *   exactly the representation that schema expects.
 */
export function timestampType(): 'timestamptz' | 'datetime' {
  return resolveDbDriver() === 'postgres' ? 'timestamptz' : 'datetime';
}
