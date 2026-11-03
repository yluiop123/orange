import type { Request } from 'express';
import type { AuthUser } from '../auth/auth-user';

export interface AppRequest extends Request {
  traceId: string;
  user?: AuthUser;
  /** Raw JSON body captured for the operation log; never contains a Buffer. */
  bodyText?: string;
}
