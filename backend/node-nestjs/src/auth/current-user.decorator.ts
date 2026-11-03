import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppRequest } from '../common/app-request';
import type { AuthUser } from './auth-user';

/** Injects the principal resolved by `JwtAuthGuard`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    return context.switchToHttp().getRequest<AppRequest>().user as AuthUser;
  },
);
