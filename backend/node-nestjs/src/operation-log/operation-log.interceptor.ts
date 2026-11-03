import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { AppRequest } from '../common/app-request';
import { OperationLogPolicy } from './operation-log.policy';
import { OperationLogService } from './operation-log.service';

/**
 * Records non-GET writes to `/api/v1/system/*` and `/auth/change-password`
 * after the response is flushed, so the stored status is the real one.
 */
@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('OperationLog');

  constructor(private readonly logs: OperationLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AppRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    const path = request.path ?? request.originalUrl.split('?')[0];
    if (!OperationLogPolicy.shouldRecord(request.method, path)) {
      return next.handle();
    }

    const startedAt = Date.now();
    response.once('finish', () => {
      const queryIndex = request.originalUrl.indexOf('?');
      const entry = {
        traceId: request.traceId ?? null,
        username: request.user?.username ?? 'anonymous',
        method: request.method,
        path,
        queryString: OperationLogPolicy.queryString(
          queryIndex >= 0 ? request.originalUrl.slice(queryIndex + 1) : null,
        ),
        requestBody: OperationLogPolicy.bodyFor(request, path),
        status: response.statusCode,
        durationMs: Date.now() - startedAt,
        ip: OperationLogPolicy.clientIp(request),
      };
      void this.logs.record(entry).catch((error: Error) => {
        this.logger.warn(`failed to write operation log: ${error.message}`);
      });
    });

    return next.handle();
  }
}
