import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRequest } from '../common/app-request';
import { BusinessException } from '../common/business-exception';
import { AUTHORITIES_KEY } from './decorators';

/**
 * Enforces the `type#path[:action]` authority strings declared on handlers.
 * Menu/directory permissions only gate the endpoint here; visibility filtering
 * happens in `/auth/menus` and the frontend.
 */
@Injectable()
export class AuthoritiesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(AUTHORITIES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AppRequest>();
    const user = request.user;
    if (!user) {
      throw BusinessException.unauthorized();
    }
    if (required.every((authority) => user.authorities.has(authority))) {
      return true;
    }
    throw BusinessException.forbidden();
  }
}
