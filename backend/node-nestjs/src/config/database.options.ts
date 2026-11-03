import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ENTITIES } from '../entities';
import type { AppConfig } from './app-config';

/**
 * One connection profile for every supported engine. The schema is owned by
 * `database/<engine>`, so `synchronize` stays off everywhere.
 *
 * `DATABASE_URL` wins over the discrete `DB_*` values. MariaDB is served
 * through TypeORM's `mysql` driver and the `mysql2` client, so a MariaDB
 * instance needs no extra native package.
 */
export function buildTypeOrmOptions(config: AppConfig): TypeOrmModuleOptions {
  const common = {
    entities: ENTITIES,
    synchronize: false,
    logging: false,
  } as const;

  const { driver, url, host, port, name, user, password, ssl } = config.db;

  if (driver === 'sqlite') {
    return {
      ...common,
      type: 'better-sqlite3',
      database: sqlitePath(config),
    };
  }

  if (driver === 'postgres') {
    return {
      ...common,
      type: 'postgres',
      ...(url
        ? { url }
        : { host, port, username: user, password, database: name }),
      ssl: ssl ? { rejectUnauthorized: false } : false,
      extra: { max: 10 },
    };
  }

  // mysql / mariadb: mysql2 speaks both protocols.
  return {
    ...common,
    type: 'mysql',
    ...(url
      ? { url }
      : { host, port, username: user, password, database: name }),
    ssl: ssl ? { rejectUnauthorized: false } : false,
    extra: { connectionLimit: 10 },
  };
}

/** `sqlite:./orange.db`, `file:./orange.db` or a bare `DB_NAME` path. */
export function sqlitePath(config: AppConfig): string {
  if (!config.db.url) {
    return config.db.name;
  }

  let path = config.db.url.trim();
  path = path.replace(/^sqlite3?:/i, '').replace(/^file:/i, '');
  const query = path.indexOf('?');
  if (query >= 0) {
    path = path.slice(0, query);
  }
  if (path.startsWith('//')) {
    path = path.slice(2);
  }
  // `sqlite:///D:/data/orange.db` leaves a leading slash before the drive.
  if (/^\/[A-Za-z]:[\\/]/.test(path)) {
    path = path.slice(1);
  }
  return path.length > 0 ? path : ':memory:';
}
