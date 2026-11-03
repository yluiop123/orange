import type { Request } from 'express';

const QUERY_LIMIT = 500;
const BODY_LIMIT = 4000;
const SENSITIVE_JSON_FIELD = /("[^"]*(?:password|token|secret)[^"]*"\s*:\s*)"(?:[^"\\]|\\.)*"/gi;

/**
 * Operation-log write policy: which requests are recorded, which fields are
 * redacted, how much is truncated and how the client IP is resolved. Pure
 * functions so the rules can be unit tested without a database.
 */
export class OperationLogPolicy {
  static shouldRecord(method: string, path: string): boolean {
    const upper = (method ?? '').toUpperCase();
    if (upper === 'GET' || upper === 'OPTIONS') {
      return false;
    }
    return path.startsWith('/api/v1/system/') || path === '/api/v1/auth/change-password';
  }

  static isSensitivePath(path: string): boolean {
    const lower = (path ?? '').toLowerCase();
    return (
      lower.endsWith('/login') ||
      lower.endsWith('/refresh') ||
      lower.endsWith('/change-password') ||
      lower.endsWith('/reset-password')
    );
  }

  static sanitizeBody(body: string | null | undefined): string | null {
    if (body === null || body === undefined) {
      return null;
    }
    const redacted = body.replace(SENSITIVE_JSON_FIELD, '$1"***"');
    return redacted.length <= BODY_LIMIT ? redacted : redacted.slice(0, BODY_LIMIT);
  }

  /** Serializes the parsed body, unless the path must never store a body. */
  static bodyFor(request: Request, path: string): string | null {
    if (OperationLogPolicy.isSensitivePath(path)) {
      return null;
    }
    const body = request.body;
    if (body === null || body === undefined) {
      return null;
    }
    if (typeof body === 'string') {
      return OperationLogPolicy.sanitizeBody(body);
    }
    if (typeof body === 'object') {
      if (Buffer.isBuffer(body)) {
        return null;
      }
      if (Object.keys(body as Record<string, unknown>).length === 0) {
        return null;
      }
      try {
        return OperationLogPolicy.sanitizeBody(JSON.stringify(body));
      } catch {
        return null;
      }
    }
    return OperationLogPolicy.sanitizeBody(String(body));
  }

  static queryString(query: string | null | undefined): string | null {
    if (query === null || query === undefined) {
      return null;
    }
    return query.length <= QUERY_LIMIT ? query : query.slice(0, QUERY_LIMIT);
  }

  static clientIp(request: Request): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    if (typeof raw === 'string' && raw.trim().length > 0) {
      const comma = raw.indexOf(',');
      return (comma >= 0 ? raw.slice(0, comma) : raw).trim();
    }
    return request.ip ?? request.socket?.remoteAddress ?? null;
  }
}
