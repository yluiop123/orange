import {
  HttpContextToken,
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, map, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { I18nService } from './i18n.service';
import { NotificationService } from './notification.service';
import { RefreshService, baseUrl } from './refresh.service';
import { TokenStore } from './token.store';
import { isApiError, type ApiError } from './api-error';
import type { Envelope } from './models';

const RETRIED = new HttpContextToken<boolean>(() => false);

function isAuthEndpoint(url?: string): boolean {
  return !!url && /(?:^|\/)auth\/(login|refresh|logout)(?:\?|$)/.test(url);
}

function toApiError(error: HttpErrorResponse): ApiError {
  const body = error.error as Partial<Envelope<unknown>> | null;
  return {
    code: body?.code ?? error.status,
    message: body?.message || error.message,
    data: body?.data,
    status: error.status,
    traceId: body?.traceId,
  };
}

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const tokens = inject(TokenStore);
  const refresh = inject(RefreshService);
  const auth = inject(AuthService);
  const router = inject(Router);
  const i18n = inject(I18nService);
  const notify = inject(NotificationService);

  const token = tokens.get();
  const prefixedUrl = request.url.startsWith('/')
    ? `${baseUrl()}${request.url}`
    : request.url;
  const outgoing = request.clone({
    url: prefixedUrl,
    setHeaders: {
      Locale: i18n.locale(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return next(outgoing).pipe(
    map((event: HttpEvent<unknown>) => {
      if (event instanceof HttpResponse) {
        const body = event.body;
        if (body && typeof body === 'object' && 'code' in body) {
          const envelope = body as Envelope<unknown>;
          if (envelope.code !== 200) {
            const apiError: ApiError = {
              code: envelope.code,
              message: envelope.message,
              data: envelope.data,
              status: event.status,
              traceId: envelope.traceId,
            };
            if (apiError.code === 40302) {
              auth.markMustChangePassword();
            } else if (!isAuthEndpoint(request.url)) {
              notify.error(apiError.message);
            }
            throw apiError;
          }
        }
      }
      return event;
    }),
    catchError((error: unknown) => {
      if (isApiError(error)) {
        return throwError(() => error);
      }
      const httpError = error as HttpErrorResponse;
      const apiError = toApiError(httpError);

      if (
        httpError.status === 401 &&
        !isAuthEndpoint(request.url) &&
        !request.context.get(RETRIED)
      ) {
        return from(refresh.refresh()).pipe(
          switchMap((newToken) => {
            if (!newToken) {
              auth.clearSession();
              if (!router.url.startsWith('/login')) {
                void router.navigate(['/login'], {
                  queryParams: { redirect: router.url },
                });
              }
              return throwError(() => apiError);
            }
            return next(
              outgoing.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
                context: outgoing.context.set(RETRIED, true),
              }),
            );
          }),
        );
      }

      if (httpError.status === 401) {
        auth.clearSession();
        if (!router.url.startsWith('/login') && !isAuthEndpoint(request.url)) {
          void router.navigate(['/login'], {
            queryParams: { redirect: router.url },
          });
        }
      } else if (httpError.status === 403 && apiError.code === 40302) {
        auth.markMustChangePassword();
      } else if (!isAuthEndpoint(request.url)) {
        notify.error(apiError.message || i18n.t('table.loadError'));
      }

      return throwError(() => apiError);
    }),
  );
};
