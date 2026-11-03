import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { AppRequest } from './app-request';
import { ApiResult, successEnvelope } from './response';
import { newTraceId } from './trace-id';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AppRequest>();
    const traceId = req.traceId ?? newTraceId();

    // The contract uses HTTP 200 for every successful call, including POST.
    context.switchToHttp().getResponse().status(200);

    return next.handle().pipe(
      map((value) => {
        if (value instanceof ApiResult) {
          return successEnvelope(value.data, traceId, value.message);
        }
        return successEnvelope(value, traceId);
      }),
    );
  }
}
