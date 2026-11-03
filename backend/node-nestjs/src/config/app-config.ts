import { Global, Injectable, Module } from '@nestjs/common';

export interface DbConfig {
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
}

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
  readonly port = int(process.env.PORT, 3000);
  readonly db: DbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: int(process.env.DB_PORT, 5432),
    name: process.env.DB_NAME || 'orange',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
  };
  readonly jwt: JwtConfig = {
    secret: process.env.JWT_SECRET || 'orange-dev-secret-change-me',
    accessExpire: int(process.env.JWT_ACCESS_EXPIRE, 900),
    refreshExpire: int(process.env.JWT_REFRESH_EXPIRE, 604800),
  };
  readonly corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
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
    retentionDays: int(process.env.OPERATION_LOG_RETENTION_DAYS, 90),
  };
}

function int(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
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
