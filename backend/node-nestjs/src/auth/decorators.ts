import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'orange:isPublic';
export const AUTHORITIES_KEY = 'orange:authorities';

/** Endpoint that does not require an access token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Requires every listed authority. Authorities use the canonical
 * `type#path[:action]` shape, e.g. `menu#/system/user` or
 * `action#/system/user:add`.
 */
export const RequireAuthority = (...authorities: string[]) =>
  SetMetadata(AUTHORITIES_KEY, authorities);
