import { NextFunction, Response } from 'express';
import { AppRequest } from './app-request';
import { resolveTraceId, TRACE_ID_HEADER } from './trace-id';

/**
 * Generates or accepts the trace id for every request and always echoes it in
 * the `X-Trace-Id` header; the response envelope reuses the same value.
 */
export function traceIdMiddleware(req: AppRequest, res: Response, next: NextFunction): void {
  const traceId = resolveTraceId(req.headers as Record<string, unknown>);
  req.traceId = traceId;
  res.setHeader(TRACE_ID_HEADER, traceId);
  next();
}
