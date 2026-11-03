import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (await auth.ensureSession()) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};

/** Loads user-info and menus before the shell's children are activated. */
export const identityGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.user()) return true;
  try {
    const user = await auth.loadIdentity();
    if (user) return true;
  } catch {
    // handled below
  }
  auth.clearSession();
  return router.createUrlTree(['/login']);
};

export const permissionGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const path = (route.data as { path?: string }).path ?? state.url.split('?')[0];
  if (auth.canView(path)) {
    return true;
  }
  return router.createUrlTree(['/forbidden'], {
    queryParams: { from: state.url },
  });
};
