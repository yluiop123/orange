import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiError } from './api-error';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly lastMessage = signal<string>('');

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  /** Prefer the server message; fall back to a translated generic message. */
  apiError(error: unknown, fallback: string): void {
    const apiError = error as ApiError | null;
    this.error(apiError?.message || fallback);
  }

  private show(message: string, kind: 'success' | 'error' | 'warning' | 'info'): void {
    this.lastMessage.set(message);
    this.snackBar.open(message, undefined, {
      duration: kind === 'error' ? 6000 : 3000,
      panelClass: [`snack-${kind}`],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
