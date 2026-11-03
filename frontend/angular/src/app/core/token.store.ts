import { Injectable, signal } from '@angular/core';

/**
 * The access token lives in memory only — never in localStorage/sessionStorage.
 * A page reload recovers the session with the HttpOnly refresh cookie.
 */
@Injectable({ providedIn: 'root' })
export class TokenStore {
  private readonly _token = signal<string | null>(null);
  private expiresAt = 0;

  readonly token = this._token.asReadonly();

  get(): string | null {
    return this._token();
  }

  has(): boolean {
    return this._token() !== null;
  }

  isExpiring(thresholdMs = 30_000): boolean {
    return (
      this._token() !== null &&
      this.expiresAt > 0 &&
      this.expiresAt - Date.now() < thresholdMs
    );
  }

  set(token: string | null, expiresInSeconds?: number): void {
    this.expiresAt = expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : 0;
    this._token.set(token);
  }

  clear(): void {
    this.expiresAt = 0;
    this._token.set(null);
  }
}
