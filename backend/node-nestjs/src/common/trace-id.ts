import { randomUUID } from 'node:crypto';

export const TRACE_ID_HEADER = 'X-Trace-Id';
export const LEGACY_TRACE_ID_HEADER = 'X-Request-Id';

const SAFE_TRACE_ID = /^[A-Za-z0-9._-]{8,64}$/;

export function newTraceId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 16);
}

/** Accepts a client-provided trace id only when it is safe to echo back. */
export function resolveTraceId(headers: Record<string, unknown>): string {
  const incoming =
    headerValue(headers['x-trace-id']) ??
    headerValue(headers['x-request-id']) ??
    headerValue(headers[TRACE_ID_HEADER]) ??
    headerValue(headers[LEGACY_TRACE_ID_HEADER]);
  if (typeof incoming === 'string' && SAFE_TRACE_ID.test(incoming)) {
    return incoming;
  }
  return newTraceId();
}

function headerValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }
  return typeof value === 'string' ? value : undefined;
}
