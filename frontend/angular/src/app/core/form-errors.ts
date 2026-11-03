import { AbstractControl, FormGroup } from '@angular/forms';
import type { ApiError } from './api-error';

/**
 * Map server-side field errors back onto an Angular form.
 * The backend returns `data: { field: "message" }` with code 40002.
 */
export function applyServerFieldErrors(
  form: FormGroup | null | undefined,
  error: unknown,
): boolean {
  const apiError = error as ApiError | null;
  const data = apiError?.data;
  if (!form || !data || typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }
  let applied = false;
  for (const [field, message] of Object.entries(data as Record<string, unknown>)) {
    if (typeof message !== 'string') continue;
    const control: AbstractControl | null = form.get(field);
    if (!control) continue;
    control.setErrors({ ...(control.errors ?? {}), server: message });
    control.markAsTouched();
    applied = true;
  }
  return applied;
}

export function serverErrorOf(control: AbstractControl | null): string | null {
  const value = control?.errors?.['server'];
  return typeof value === 'string' ? value : null;
}
