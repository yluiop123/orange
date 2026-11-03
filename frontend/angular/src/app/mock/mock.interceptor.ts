import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { MockBackend } from './mock-backend';

/**
 * Serves the API from memory when mock mode is on. It runs after the auth
 * interceptor so envelope/401/403 handling stays on the same path as a real
 * backend. Unknown routes still get a mock 404 instead of a network call.
 */
export const mockInterceptor: HttpInterceptorFn = (request, next) => {
  const backend = inject(MockBackend);
  if (!backend.enabled) return next(request);

  const reply = backend.handle(request);
  if (reply.status >= 400) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: reply.status,
          statusText: 'Mock error',
          url: request.url,
          error: reply.body,
        }),
    );
  }
  return of(
    new HttpResponse<unknown>({
      status: reply.status,
      body: reply.body,
      url: request.url,
    }),
  ) as Observable<HttpEvent<unknown>>;
};
