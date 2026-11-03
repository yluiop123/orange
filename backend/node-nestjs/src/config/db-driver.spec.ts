import { driverFromDatabaseUrl, resolveDbDriver } from './db-driver';

describe('driverFromDatabaseUrl', () => {
  it('maps every supported scheme', () => {
    expect(driverFromDatabaseUrl('postgres://u:p@h:5432/db')).toBe('postgres');
    expect(driverFromDatabaseUrl('postgresql://u:p@h:5432/db')).toBe('postgres');
    expect(driverFromDatabaseUrl('mysql://u:p@h:3306/db')).toBe('mysql');
    expect(driverFromDatabaseUrl('mariadb://u:p@h:3306/db')).toBe('mariadb');
    expect(driverFromDatabaseUrl('sqlite:./orange.db')).toBe('sqlite');
    expect(driverFromDatabaseUrl('sqlite3:./orange.db')).toBe('sqlite');
    expect(driverFromDatabaseUrl('file:./orange.db')).toBe('sqlite');
  });

  it('returns null for unknown or missing schemes', () => {
    expect(driverFromDatabaseUrl(undefined)).toBeNull();
    expect(driverFromDatabaseUrl('')).toBeNull();
    expect(driverFromDatabaseUrl('./orange.db')).toBeNull();
    expect(driverFromDatabaseUrl('oracle://h/db')).toBeNull();
  });
});

describe('resolveDbDriver', () => {
  const original = { driver: process.env.DB_DRIVER, url: process.env.DATABASE_URL };

  afterEach(() => {
    restore('DB_DRIVER', original.driver);
    restore('DATABASE_URL', original.url);
  });

  it('defaults to PostgreSQL', () => {
    delete process.env.DB_DRIVER;
    delete process.env.DATABASE_URL;
    expect(resolveDbDriver()).toBe('postgres');
  });

  it('infers the driver from DATABASE_URL', () => {
    delete process.env.DB_DRIVER;
    process.env.DATABASE_URL = 'mysql://root:root@localhost:3306/orange';
    expect(resolveDbDriver()).toBe('mysql');
  });

  it('lets DB_DRIVER win over the URL scheme', () => {
    process.env.DB_DRIVER = 'MARIADB';
    process.env.DATABASE_URL = 'mysql://root:root@localhost:3306/orange';
    expect(resolveDbDriver()).toBe('mariadb');
  });

  it('rejects an unsupported DB_DRIVER', () => {
    process.env.DB_DRIVER = 'oracle';
    expect(() => resolveDbDriver()).toThrow(/Unsupported DB_DRIVER/);
  });
});

function restore(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
