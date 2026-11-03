import { OperationLogPolicy } from './operation-log.policy';

describe('OperationLogPolicy', () => {
  it('records only system writes and password changes', () => {
    expect(OperationLogPolicy.shouldRecord('POST', '/api/v1/system/users')).toBe(true);
    expect(OperationLogPolicy.shouldRecord('PATCH', '/api/v1/system/users/1')).toBe(true);
    expect(OperationLogPolicy.shouldRecord('DELETE', '/api/v1/system/users')).toBe(true);
    expect(OperationLogPolicy.shouldRecord('POST', '/api/v1/auth/change-password')).toBe(true);
    expect(OperationLogPolicy.shouldRecord('POST', '/api/v1/auth/login')).toBe(false);
    expect(OperationLogPolicy.shouldRecord('GET', '/api/v1/system/users')).toBe(false);
    expect(OperationLogPolicy.shouldRecord('OPTIONS', '/api/v1/system/users')).toBe(false);
  });

  it('treats password and token paths as sensitive', () => {
    expect(OperationLogPolicy.isSensitivePath('/api/v1/auth/login')).toBe(true);
    expect(OperationLogPolicy.isSensitivePath('/api/v1/auth/refresh')).toBe(true);
    expect(OperationLogPolicy.isSensitivePath('/api/v1/auth/change-password')).toBe(true);
    expect(OperationLogPolicy.isSensitivePath('/api/v1/system/users/1/reset-password')).toBe(true);
    expect(OperationLogPolicy.isSensitivePath('/api/v1/system/users')).toBe(false);
  });

  it('redacts sensitive JSON fields and truncates the body to 4000 chars', () => {
    const body = '{"password":"secret","token":"abc","name":"ok"}';
    const sanitized = OperationLogPolicy.sanitizeBody(body) as string;

    expect(sanitized).not.toContain('secret');
    expect(sanitized).not.toContain('"abc"');
    expect(sanitized).toContain('"***"');
    expect(sanitized).toContain('ok');
    expect(OperationLogPolicy.sanitizeBody('a'.repeat(5000))).toHaveLength(4000);
    expect(OperationLogPolicy.sanitizeBody(null)).toBeNull();
  });

  it('truncates the query string to 500 chars', () => {
    expect(OperationLogPolicy.queryString('a'.repeat(600))).toHaveLength(500);
    expect(OperationLogPolicy.queryString(null)).toBeNull();
  });

  it('resolves the client IP from X-Forwarded-For first', () => {
    expect(
      OperationLogPolicy.clientIp({
        headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
        ip: '10.0.0.2',
        socket: {},
      } as never),
    ).toBe('203.0.113.1');
    expect(
      OperationLogPolicy.clientIp({
        headers: {},
        ip: '127.0.0.1',
        socket: {},
      } as never),
    ).toBe('127.0.0.1');
  });
});
