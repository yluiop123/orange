import { Global, Injectable, Module } from '@nestjs/common';
import './env';
import { resolveDbDriver, type DbDriver } from './db-driver';

export interface DbConfig {
  driver: DbDriver;
  /** `DATABASE_URL`; when set it wins over the discrete `DB_*` values. */
  url?: string;
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl: boolean;
}

export interface JwtConfig {
  secret: string;
  accessExpire: number;
  refreshExpire: number;
  issuer: string;
}

/** Shared development fallback. Production must override it. */
const DEV_JWT_SECRET = 'orange-dev-secret-change-me-in-production';

export interface CookieConfig {
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  domain?: string;
  path: string;
}

export interface LoginConfig {
  userMaxAttempts: number;
  ipMaxAttempts: number;
  lockMinutes: number;
}

export interface OperationLogConfig {
  retentionDays: number;
}

/**
 * Environment-backed configuration. Mirrors the Spring Boot `application.yaml`
 * defaults so both backends behave the same out of the box.
 */
@Injectable()
export class AppConfig {
  readonly port = int(process.env.APP_PORT ?? process.env.PORT, 3000);
  readonly db: DbConfig = buildDbConfig();
  readonly jwt: JwtConfig = (() => {
    const secret = process.env.JWT_SECRET || DEV_JWT_SECRET;
    const environment = (process.env.APP_ENV || process.env.NODE_ENV || 'local').toLowerCase();
    if ((environment === 'production' || environment === 'prod') && secret === DEV_JWT_SECRET) {
      throw new Error('JWT_SECRET must be set to a non-default value in production');
    }
    return {
      secret,
      accessExpire: int(process.env.JWT_ACCESS_EXPIRE, 900),
      refreshExpire: int(process.env.JWT_REFRESH_EXPIRE, 604800),
      issuer: process.env.JWT_ISSUER || 'orange',
    };
  })();
  readonly corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  readonly cookie: CookieConfig = {
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: normalizeSameSite(process.env.COOKIE_SAME_SITE),
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/api/v1/auth',
  };
  readonly login: LoginConfig = {
    userMaxAttempts: int(process.env.LOGIN_MAX_ATTEMPTS, 5),
    ipMaxAttempts: int(process.env.LOGIN_IP_MAX_ATTEMPTS, 20),
    lockMinutes: int(process.env.LOGIN_LOCK_MINUTES, 15),
  };
  readonly operationLog: OperationLogConfig = {
    retentionDays: int(
      process.env.LOG_RETENTION_DAYS ?? process.env.OPERATION_LOG_RETENTION_DAYS,
      90,
    ),
  };
}

function int(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * PostgreSQL keeps its historical defaults. MySQL/MariaDB default to
 * `localhost:3306` with `root/root`, SQLite to `./orange.db`; `DATABASE_URL`
 * overrides all discrete `DB_*` values for the selected driver.
 */
function buildDbConfig(): DbConfig {
  const driver = resolveDbDriver();
  const url = (process.env.DATABASE_URL ?? '').trim() || undefined;
  const postgres = driver === 'postgres';

  return {
    driver,
    url,
    host: process.env.DB_HOST || 'localhost',
    port: int(process.env.DB_PORT, postgres ? 5432 : 3306),
    name: process.env.DB_NAME || (driver === 'sqlite' ? 'orange.db' : 'orange'),
    user: process.env.DB_USER || (postgres ? 'postgres' : 'root'),
    password: process.env.DB_PASSWORD || (postgres ? 'postgres' : 'root'),
    ssl: process.env.DB_SSL === 'true',
  };
}

function normalizeSameSite(value: string | undefined): 'lax' | 'strict' | 'none' {
  const normalized = (value || 'lax').toLowerCase();
  if (normalized === 'strict' || normalized === 'none') {
    return normalized;
  }
  return 'lax';
}

@Global()
@Module({
  providers: [AppConfig],
  exports: [AppConfig],
})
export class AppConfigModule {}
