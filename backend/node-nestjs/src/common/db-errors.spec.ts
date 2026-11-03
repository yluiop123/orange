import { isUniqueViolation } from './db-errors';

function driverError(error: unknown): unknown {
  return { driverError: error };
}

describe('isUniqueViolation', () => {
  it('recognises PostgreSQL SQLSTATE 23505', () => {
    expect(isUniqueViolation(driverError({ code: '23505' }))).toBe(true);
  });

  it('recognises MySQL and MariaDB duplicate entries', () => {
    expect(isUniqueViolation(driverError({ code: 'ER_DUP_ENTRY', errno: 1062 }))).toBe(true);
    expect(isUniqueViolation(driverError({ errno: 1062 }))).toBe(true);
  });

  it('recognises SQLite constraint codes', () => {
    expect(isUniqueViolation(driverError({ code: 'SQLITE_CONSTRAINT_UNIQUE' }))).toBe(true);
    expect(isUniqueViolation(driverError({ code: 'SQLITE_CONSTRAINT_PRIMARYKEY' }))).toBe(true);
  });

  it('falls back to the driver message', () => {
    expect(isUniqueViolation(driverError({ message: 'UNIQUE constraint failed: sys_revoked_token.jti' }))).toBe(true);
    expect(isUniqueViolation(driverError({ message: "Duplicate entry 'x' for key 'PRIMARY'" }))).toBe(true);
  });

  it('ignores other errors', () => {
    expect(isUniqueViolation(driverError({ code: '23503' }))).toBe(false);
    expect(isUniqueViolation(driverError({ errno: 1452 }))).toBe(false);
    expect(isUniqueViolation(new Error('boom'))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation('boom')).toBe(false);
  });
});
