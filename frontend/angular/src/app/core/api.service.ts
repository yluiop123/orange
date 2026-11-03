import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { Envelope, OperationLog, PageResult } from './models';
import { isApiError } from './api-error';

type ParamValue = string | number | boolean | null | undefined;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(path: string, params?: Record<string, ParamValue>): Observable<T> {
    return this.unwrap(this.http.get<Envelope<T>>(path, { params: toParams(params) }));
  }

  post<T>(path: string, body?: unknown, params?: Record<string, ParamValue>): Observable<T> {
    return this.unwrap(this.http.post<Envelope<T>>(path, body ?? {}, { params: toParams(params) }));
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.unwrap(this.http.patch<Envelope<T>>(path, body ?? {}));
  }

  delete<T>(path: string, params?: Record<string, ParamValue>): Observable<T> {
    return this.unwrap(this.http.delete<Envelope<T>>(path, { params: toParams(params) }));
  }

  private unwrap<T>(source: Observable<Envelope<T>>): Observable<T> {
    return source.pipe(
      map((envelope) => {
        if (envelope.code !== 200) {
          throw {
            code: envelope.code,
            message: envelope.message,
            data: envelope.data,
            status: envelope.code,
            traceId: envelope.traceId,
          };
        }
        return envelope.data;
      }),
    );
  }
}

function toParams(params?: Record<string, ParamValue>): HttpParams | undefined {
  if (!params) return undefined;
  let httpParams = new HttpParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    httpParams = httpParams.set(key, String(value));
  }
  return httpParams;
}

/** Client-side paging for endpoints that return a full tree array. */
export function pageOf<T>(rows: T[], page: number, size: number): PageResult<T> {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, size)));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * size;
  return {
    total,
    list: rows.slice(start, start + size),
    page: safePage,
    size,
    totalPages,
  };
}

export function asApiError(error: unknown): string | null {
  return isApiError(error) ? error.message : null;
}

export type { OperationLog };
