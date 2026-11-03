import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { TokenStore } from './token.store';
import { sessionHint } from './session-hint';
import type { Envelope, TokenResponse } from './models';

/**
 * Refresh uses `fetch` rather than HttpClient on purpose: the request must not
 * pass through the auth interceptor, otherwise a 401 would recurse.
 * The refresh token is an HttpOnly cookie, hence `credentials: 'include'`.
 */
@Injectable({ providedIn: 'root' })
export class RefreshService {
  private readonly tokens = inject(TokenStore);
  private inFlight: Promise<string | null> | null = null;

  refresh(): Promise<string | null> {
    if (!this.inFlight) {
      this.inFlight = this.performRefresh().finally(() => {
        this.inFlight = null;
      });
    }
    return this.inFlight;
  }

  private async performRefresh(): Promise<string | null> {
    try {
      const response = await fetch(`${baseUrl()}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        this.tokens.clear();
        sessionHint.clear();
        return null;
      }
      const body = (await response.json()) as Envelope<TokenResponse>;
      const token = body?.data?.token ?? null;
      if (body?.code !== 200 || !token) {
        this.tokens.clear();
        sessionHint.clear();
        return null;
      }
      this.tokens.set(token, body.data.expiresIn);
      return token;
    } catch {
      this.tokens.clear();
      return null;
    }
  }
}

export function baseUrl(): string {
  return environment.apiBase.replace(/\/+$/, '');
}
